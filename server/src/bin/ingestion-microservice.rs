use std::collections::HashMap;
use std::num::NonZeroUsize;

use diesel::r2d2::ConnectionManager;
use diesel::PgConnection;
use redis::AsyncCommands;
use tracing_subscriber::{prelude::*, EnvFilter, Layer};
use trieve_server::data::models::{self, ChunkGroupBookmark, Event, ServerDatasetConfiguration};
use trieve_server::errors::ServiceError;
use trieve_server::get_env;
use trieve_server::handlers::chunk_handler::IngestionMessage;
use trieve_server::operators::chunk_operator::{
    get_chunks_by_tracking_id_query, get_metadata_from_point_ids,
    insert_bulk_chunk_metadatas_query, insert_chunk_metadata_query,
    insert_duplicate_chunk_metadata_query,
};
use trieve_server::operators::event_operator::create_event_query;
use trieve_server::operators::group_operator::create_chunk_bookmark_query;
use trieve_server::operators::model_operator::create_embedding;
use trieve_server::operators::parse_operator::{average_embeddings, coarse_doc_chunker};
use trieve_server::operators::qdrant_operator::{
    add_bookmark_to_qdrant_query, bulk_create_qdrant_points_query, create_new_qdrant_point_query,
    update_qdrant_point_query,
};
use trieve_server::operators::search_operator::global_unfiltered_top_match_query;

#[tokio::main]
async fn main() -> std::io::Result<()> {
    let sentry_url = std::env::var("SENTRY_URL");
    let _guard = if let Ok(sentry_url) = sentry_url {
        log::info!("Sentry monitoring enabled");

        let guard = sentry::init((
            sentry_url,
            sentry::ClientOptions {
                release: sentry::release_name!(),
                traces_sample_rate: 1.0,
                ..Default::default()
            },
        ));

        tracing_subscriber::Registry::default()
            .with(sentry::integrations::tracing::layer())
            .with(
                tracing_subscriber::fmt::layer().with_filter(
                    EnvFilter::from_default_env()
                        .add_directive(tracing_subscriber::filter::LevelFilter::INFO.into()),
                ),
            )
            .init();

        Some(guard)
    } else {
        tracing_subscriber::Registry::default()
            .with(
                tracing_subscriber::fmt::layer().with_filter(
                    EnvFilter::from_default_env()
                        .add_directive(tracing_subscriber::filter::LevelFilter::INFO.into()),
                ),
            )
            .init();

        None
    };

    let thread_num = if let Ok(thread_num) = std::env::var("THREAD_NUM") {
        thread_num
            .parse::<usize>()
            .expect("THREAD_NUM must be a number")
    } else {
        std::thread::available_parallelism().expect(
            "Failed to get number of available threads. Please set THREAD_NUM environment variable",
        ).get() * 2
    };

    let database_url = get_env!("DATABASE_URL", "DATABASE_URL is not set");
    let manager = ConnectionManager::<PgConnection>::new(database_url);
    let pool: models::Pool = r2d2::Pool::builder()
        .build(manager)
        .expect("Failed to create pool.");

    let web_pool = actix_web::web::Data::new(pool.clone());

    let threads: Vec<_> = (0..thread_num)
        .map(|i| {
            let web_pool = web_pool.clone();
            ingestion_service(i, web_pool)
        })
        .collect();

    futures::future::join_all(threads).await;

    Ok(())
}

#[tracing::instrument(skip(web_pool))]
async fn ingestion_service(thread: usize, web_pool: actix_web::web::Data<models::Pool>) {
    let redis_url = get_env!("REDIS_URL", "REDIS_URL is not set");
    let redis_client = redis::Client::open(redis_url).unwrap();
    let mut redis_connection = redis_client
        .get_multiplexed_tokio_connection()
        .await
        .unwrap();

    log::info!("Starting ingestion service thread {:?}", thread);
    let num_to_process: NonZeroUsize = std::env::var("NUM_TO_PROCESS")
        .unwrap_or("10".to_string())
        .parse::<NonZeroUsize>()
        .unwrap_or(NonZeroUsize::new(10).expect("10 is not zero"));

    loop {
        let single_kv = redis_connection
            .brpop::<&str, Vec<String>>("ingestion", 0.0)
            .await
            .map_err(|err| {
                log::error!("Failed to get payload from redis: {:?}", err);
                ServiceError::InternalServerError("Failed to get payload from redis".into())
            });

        let num_to_process_kvs = redis_connection
            .rpop::<&str, Vec<String>>("ingestion", Some(num_to_process))
            .await
            .map_err(|err| {
                log::error!("Failed to get payload from redis: {:?}", err);
                ServiceError::InternalServerError("Failed to get payload from redis".into())
            });

        let payloads = match (single_kv, num_to_process_kvs) {
            (Ok(single), Ok(mut multiple)) => {
                multiple.push(single[1].clone());
                multiple
            }
            _ => continue,
        };

        let ingestion_messages = payloads
            .iter()
            .map(
                |payload| match serde_json::from_str::<IngestionMessage>(payload) {
                    Ok(ingestion_message) => Some(ingestion_message),
                    Err(err) => {
                        log::error!(
                            "Failed to parse ingestion message: {:?} | {:?}",
                            err,
                            payload
                        );
                        None
                    }
                },
            )
            .filter(|ingestion_message| ingestion_message.is_some())
            .map(|ingestion_message| ingestion_message.expect("Ingestion message must be some"))
            .collect::<Vec<IngestionMessage>>();

        let single_upload_messages = ingestion_messages
            .iter()
            .filter(|ingestion_message| {
                let server_config =
                    ServerDatasetConfiguration::from_json(ingestion_message.dataset_config.clone());
                (server_config.COLLISIONS_ENABLED
                    && server_config.DUPLICATE_DISTANCE_THRESHOLD < 1.0)
                    || ingestion_message
                        .chunk
                        .clone()
                        .split_avg
                        .is_some_and(|split_avg| split_avg == true)
                    || ingestion_message
                        .chunk
                        .clone()
                        .group_ids
                        .is_some_and(|group_ids| !group_ids.is_empty())
                    || ingestion_message
                        .chunk
                        .upsert_by_tracking_id
                        .is_some_and(|upsert| upsert == true)
            })
            .cloned()
            .collect::<Vec<IngestionMessage>>();

        let multiple_upload_messages = ingestion_messages
            .iter()
            .filter(|ingestion_message| {
                !single_upload_messages.iter().any(|single_upload_message| {
                    single_upload_message.chunk_metadata.id == ingestion_message.chunk_metadata.id
                })
            })
            .cloned()
            .collect::<Vec<IngestionMessage>>();

        if !multiple_upload_messages.is_empty() {
            let _ = bulk_upload_chunks(thread, multiple_upload_messages, web_pool.clone()).await;
        }

        for payload in single_upload_messages {
            let server_dataset_configuration =
                ServerDatasetConfiguration::from_json(payload.dataset_config.clone());
            match upload_chunk(
                payload.clone(),
                web_pool.clone(),
                server_dataset_configuration,
            )
            .await
            {
                Ok(_) => {
                    log::info!("Uploaded chunk: {:?}", payload.chunk_metadata.id);
                    let _ = create_event_query(
                        Event::from_details(
                            payload.chunk_metadata.dataset_id,
                            models::EventType::CardUploaded {
                                chunk_id: payload.chunk_metadata.id,
                            },
                        ),
                        web_pool.clone(),
                    )
                    .map_err(|err| {
                        log::error!("Failed to create event: {:?}", err);
                    });
                }
                Err(err) => {
                    log::error!("Failed to upload chunk: {:?}", err);
                    let _ = create_event_query(
                        Event::from_details(
                            payload.chunk_metadata.dataset_id,
                            models::EventType::CardUploadFailed {
                                chunk_id: payload.chunk_metadata.id,
                                error: format!("Failed to upload chunk: {:?}", err),
                            },
                        ),
                        web_pool.clone(),
                    )
                    .map_err(|err| {
                        log::error!("Failed to create event: {:?}", err);
                    });
                }
            }
        }
    }
}

#[tracing::instrument(skip(web_pool))]
async fn upload_chunk(
    mut payload: IngestionMessage,
    web_pool: actix_web::web::Data<models::Pool>,
    config: ServerDatasetConfiguration,
) -> Result<(), ServiceError> {
    let mut new_chunk_id = payload.chunk_metadata.id;
    let mut qdrant_point_id = payload
        .chunk_metadata
        .qdrant_point_id
        .unwrap_or(uuid::Uuid::new_v4());

    let dataset_config = ServerDatasetConfiguration::from_json(payload.dataset_config);
    let embedding_vector = if let Some(embedding_vector) = payload.chunk.chunk_vector.clone() {
        embedding_vector
    } else {
        match payload.chunk.split_avg.unwrap_or(false) {
            true => {
                let chunks = coarse_doc_chunker(payload.chunk_metadata.content.clone());
                let mut embeddings: Vec<Vec<f32>> = vec![];
                for chunk in chunks {
                    let embedding = create_embedding(&chunk, "doc", dataset_config.clone())
                        .await
                        .map_err(|err| {
                            ServiceError::InternalServerError(format!(
                                "Failed to create embedding: {:?}",
                                err
                            ))
                        })?;
                    embeddings.push(embedding);
                }

                average_embeddings(embeddings).map_err(|err| {
                    ServiceError::InternalServerError(format!(
                        "Failed to average embeddings: {:?}",
                        err.message
                    ))
                })?
            }
            false => create_embedding(
                &payload.chunk_metadata.content,
                "doc",
                dataset_config.clone(),
            )
            .await
            .map_err(|err| {
                ServiceError::InternalServerError(format!("Failed to create embedding: {:?}", err))
            })?,
        }
    };

    let mut collision: Option<uuid::Uuid> = None;

    let duplicate_distance_threshold = dataset_config.DUPLICATE_DISTANCE_THRESHOLD;

    if duplicate_distance_threshold < 1.0 || dataset_config.COLLISIONS_ENABLED {
        let first_semantic_result = global_unfiltered_top_match_query(
            embedding_vector.clone(),
            payload.chunk_metadata.dataset_id,
            config.clone(),
        )
        .await
        .map_err(|err| {
            ServiceError::InternalServerError(format!("Failed to get top match: {:?}", err))
        })?;

        if first_semantic_result.score >= duplicate_distance_threshold {
            //Sets collision to collided chunk id
            collision = Some(first_semantic_result.point_id);

            let score_chunk_result =
                get_metadata_from_point_ids(vec![first_semantic_result.point_id], web_pool.clone())
                    .await;

            match score_chunk_result {
                Ok(chunk_results) => chunk_results.first().unwrap().clone(),
                Err(err) => {
                    return Err(ServiceError::InternalServerError(format!(
                        "Failed to get chunk metadata: {:?}",
                        err
                    )))
                }
            };
        }
    }

    //if collision is not nil, insert chunk with collision
    if collision.is_some() {
        update_qdrant_point_query(
            None,
            collision.expect("Collision must be some"),
            None,
            payload.chunk_metadata.dataset_id,
            config.clone(),
        )
        .await
        .map_err(|err| {
            ServiceError::InternalServerError(format!("Failed to update qdrant point: {:?}", err))
        })?;

        insert_duplicate_chunk_metadata_query(
            payload.chunk_metadata.clone(),
            collision.expect("Collision should must be some"),
            payload.chunk.file_id,
            web_pool.clone(),
        )
        .map_err(|err| {
            ServiceError::InternalServerError(format!(
                "Failed to insert duplicate chunk metadata: {:?}",
                err
            ))
        })?;
    }
    //if collision is nil and embedding vector is some, insert chunk with no collision
    else {
        payload.chunk_metadata.qdrant_point_id = Some(qdrant_point_id);

        let inserted_chunk = insert_chunk_metadata_query(
            payload.chunk_metadata.clone(),
            payload.chunk.file_id,
            payload.dataset_id,
            payload.upsert_by_tracking_id,
            web_pool.clone(),
        )
        .await
        .map_err(|err| {
            ServiceError::InternalServerError(format!("Failed to insert chunk metadata: {:?}", err))
        })?;

        qdrant_point_id = inserted_chunk.qdrant_point_id.unwrap_or(qdrant_point_id);
        new_chunk_id = inserted_chunk.id;

        create_new_qdrant_point_query(
            qdrant_point_id,
            embedding_vector,
            payload.chunk_metadata.clone(),
            payload.chunk_metadata.dataset_id,
            config.clone(),
        )
        .await
        .map_err(|err| {
            ServiceError::InternalServerError(format!(
                "Failed to create new qdrant point: {:?}",
                err
            ))
        })?;
    }

    if let Some(group_ids_to_bookmark) = payload.chunk.group_ids {
        for group_id_to_bookmark in group_ids_to_bookmark {
            let chunk_group_bookmark =
                ChunkGroupBookmark::from_details(group_id_to_bookmark, new_chunk_id);

            let create_chunk_bookmark_res =
                create_chunk_bookmark_query(web_pool.clone(), chunk_group_bookmark).map_err(
                    |err| {
                        log::error!("Failed to create chunk bookmark: {:?}", err);
                        ServiceError::InternalServerError(format!(
                            "Failed to create chunk bookmark: {:?}",
                            err
                        ))
                    },
                );

            if create_chunk_bookmark_res.is_ok() {
                add_bookmark_to_qdrant_query(qdrant_point_id, group_id_to_bookmark, config.clone())
                    .await
                    .map_err(|err| {
                        log::error!("Failed to add bookmark to qdrant: {:?}", err);
                        ServiceError::InternalServerError(format!(
                            "Failed to add bookmark to qdrant: {:?}",
                            err
                        ))
                    })?;
            }
        }
    }

    Ok(())
}

#[tracing::instrument(skip(ingestion_messages, web_pool))]
async fn bulk_upload_chunks(
    _thread: usize,
    ingestion_messages: Vec<IngestionMessage>,
    web_pool: actix_web::web::Data<models::Pool>,
) -> Result<(), ServiceError> {
    let mut ingestion_messages = ingestion_messages.clone();

    let tracking_dataset_ids = ingestion_messages
        .iter()
        .filter(|ingestion_message| ingestion_message.chunk_metadata.tracking_id.is_some())
        .map(|ingestion_message| {
            (
                <Option<std::string::String> as Clone>::clone(
                    &ingestion_message.chunk_metadata.tracking_id,
                )
                .expect("Tracking id must be some"),
                ingestion_message.dataset_id,
            )
        })
        .collect::<Vec<_>>();

    let mut tracking_dataset_ids_map = HashMap::new();
    for (tracking_id, dataset_id) in tracking_dataset_ids {
        tracking_dataset_ids_map
            .entry(dataset_id)
            .or_insert(vec![])
            .push(tracking_id);
    }

    let get_chunks_by_tracking_ids_futures = tracking_dataset_ids_map
        .iter()
        .map(|(dataset_id, tracking_ids)| {
            get_chunks_by_tracking_id_query(
                tracking_ids.clone(),
                dataset_id.clone(),
                web_pool.clone(),
            )
        })
        .collect::<Vec<_>>();

    let tracking_chunk_results =
        futures::future::join_all(get_chunks_by_tracking_ids_futures).await;

    for tracking_chunk_result in tracking_chunk_results {
        match tracking_chunk_result {
            Ok(tracking_results) => {
                for tracking_result in tracking_results {
                    let tracking_result_tracking_id = tracking_result.tracking_id;
                    if let Some(tracking_result_tracking_id) = tracking_result_tracking_id {
                        ingestion_messages.retain(|ingestion_message| {
                            let message_tracking_id =
                                ingestion_message.chunk_metadata.tracking_id.clone();
                            match message_tracking_id {
                                Some(message_tracking_id) => {
                                    message_tracking_id != tracking_result_tracking_id
                                }
                                None => true,
                            }
                        });
                    }
                }
            }
            _ => continue,
        }
    }

    let create_embedding_futures = ingestion_messages
        .iter()
        .map(|ingestion_message| {
            create_embedding(
                &ingestion_message.chunk_metadata.content,
                "doc",
                ServerDatasetConfiguration::from_json(ingestion_message.dataset_config.clone()),
            )
        })
        .collect::<Vec<_>>();

    let chunk_metadatas = ingestion_messages
        .iter()
        .map(|ingestion_message| ingestion_message.chunk_metadata.clone())
        .collect::<Vec<_>>();

    let embeddings = futures::future::join_all(create_embedding_futures).await;

    let mut insert_qdrant_datas = vec![];
    for i in 0..ingestion_messages.len() {
        let embedding = match &embeddings[i] {
            Ok(embedding) => embedding.clone(),
            Err(err) => {
                log::error!("Failed to create embedding: {:?}", err);
                continue;
            }
        };
        let ingestion_message = &ingestion_messages[i];
        let qdrant_point_id = ingestion_message
            .chunk_metadata
            .qdrant_point_id
            .unwrap_or(uuid::Uuid::new_v4());
        let chunk_metadata = ingestion_message.chunk_metadata.clone();
        let dataset_id = ingestion_message.dataset_id;
        let config =
            ServerDatasetConfiguration::from_json(ingestion_message.dataset_config.clone());

        insert_qdrant_datas.push((
            qdrant_point_id,
            embedding,
            chunk_metadata,
            dataset_id,
            config,
        ));
    }

    let bulk_pg_insert_future =
        insert_bulk_chunk_metadatas_query(chunk_metadatas, web_pool.clone());
    let bulk_create_qrant_future = bulk_create_qdrant_points_query(insert_qdrant_datas);

    let _ = futures::future::join(bulk_pg_insert_future, bulk_create_qrant_future).await;

    log::info!("Bulk uploaded {} chunks", ingestion_messages.len(),);

    Ok(())
}

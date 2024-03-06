use std::collections::HashMap;

use qdrant_client::{
    client::{QdrantClient, QdrantClientConfig},
    qdrant::{
        payload_index_params::IndexParams, quantization_config::Quantization, BinaryQuantization,
        CreateCollection, Distance, FieldType, HnswConfigDiff, PayloadIndexParams,
        QuantizationConfig, SparseIndexConfig, SparseVectorConfig, SparseVectorParams,
        TextIndexParams, TokenizerType, VectorParams, VectorParamsMap, VectorsConfig,
    },
};
use trieve_server::errors::{DefaultError, ServiceError};

pub fn get_qdrant_connection(
    qdrant_url: &str,
    qdrant_api_key: &str,
) -> Result<QdrantClient, DefaultError> {
    let mut config = QdrantClientConfig::from_url(qdrant_url);
    config.api_key = Some(qdrant_api_key.to_owned());
    QdrantClient::new(Some(config)).map_err(|_err| DefaultError {
        message: "Failed to connect to Qdrant",
    })
}

/// Create Qdrant collection and indexes needed
pub async fn create_new_qdrant_collection_query(
    qdrant_url: &str,
    qdrant_api_key: &str,
    qdrant_collection: &str,
) -> Result<(), ServiceError> {
    let qdrant_client = get_qdrant_connection(qdrant_url, qdrant_api_key)
        .map_err(|err| ServiceError::BadRequest(err.message.into()))?;

    // check if collection exists
    let collection = qdrant_client.collection_info(qdrant_collection).await;
    if let Ok(collection) = collection {
        if collection.result.is_some() {
            return Err(ServiceError::BadRequest(
                "Collection already exists".to_string(),
            ));
        }
    }

    let mut sparse_vector_config = HashMap::new();
    sparse_vector_config.insert(
        "sparse_vectors".to_string(),
        SparseVectorParams {
            index: Some(SparseIndexConfig {
                on_disk: Some(false),
                ..Default::default()
            }),
        },
    );

    qdrant_client
        .create_collection(&CreateCollection {
            collection_name: qdrant_collection.to_owned(),
            vectors_config: Some(VectorsConfig {
                config: Some(qdrant_client::qdrant::vectors_config::Config::ParamsMap(
                    VectorParamsMap {
                        map: HashMap::from([
                            (
                                "384_vectors".to_string(),
                                VectorParams {
                                    size: 384,
                                    distance: Distance::Cosine.into(),
                                    hnsw_config: None,
                                    quantization_config: None,
                                    on_disk: None,
                                },
                            ),
                            (
                                "768_vectors".to_string(),
                                VectorParams {
                                    size: 768,
                                    distance: Distance::Cosine.into(),
                                    hnsw_config: None,
                                    quantization_config: None,
                                    on_disk: None,
                                },
                            ),
                            (
                                "1024_vectors".to_string(),
                                VectorParams {
                                    size: 1024,
                                    distance: Distance::Cosine.into(),
                                    hnsw_config: None,
                                    quantization_config: Some(QuantizationConfig {
                                        quantization: Some(Quantization::Binary(
                                            BinaryQuantization {
                                                always_ram: Some(true),
                                            },
                                        )),
                                    }),
                                    on_disk: Some(true),
                                },
                            ),
                            (
                                "1536_vectors".to_string(),
                                VectorParams {
                                    size: 1536,
                                    distance: Distance::Cosine.into(),
                                    hnsw_config: None,
                                    quantization_config: None,
                                    on_disk: None,
                                },
                            ),
                        ]),
                    },
                )),
            }),
            hnsw_config: Some(HnswConfigDiff {
                payload_m: Some(16),
                m: Some(0),
                ..Default::default()
            }),
            sparse_vectors_config: Some(SparseVectorConfig {
                map: sparse_vector_config,
            }),
            ..Default::default()
        })
        .await
        .map_err(|err| {
            if err.to_string().contains("already exists") {
                return ServiceError::BadRequest("Collection already exists".into());
            }
            ServiceError::BadRequest("Failed to create Collection".into())
        })?;

    qdrant_client
        .create_field_index(qdrant_collection, "link", FieldType::Text, None, None)
        .await
        .map_err(|_| ServiceError::BadRequest("Failed to create index".into()))?;

    qdrant_client
        .create_field_index(qdrant_collection, "tag_set", FieldType::Text, None, None)
        .await
        .map_err(|_| ServiceError::BadRequest("Failed to create index".into()))?;

    qdrant_client
        .create_field_index(
            qdrant_collection,
            "dataset_id",
            FieldType::Keyword,
            None,
            None,
        )
        .await
        .map_err(|_| ServiceError::BadRequest("Failed to create index".into()))?;

    qdrant_client
        .create_field_index(
            qdrant_collection,
            "chunk_html",
            FieldType::Text,
            Some(&PayloadIndexParams {
                index_params: Some(IndexParams::TextIndexParams(TextIndexParams {
                    tokenizer: TokenizerType::Whitespace as i32,
                    min_token_len: Some(2),
                    max_token_len: Some(10),
                    lowercase: Some(true),
                })),
            }),
            None,
        )
        .await
        .map_err(|_| ServiceError::BadRequest("Failed to create index".into()))?;

    qdrant_client
        .create_field_index(
            qdrant_collection,
            "metadata",
            FieldType::Keyword,
            None,
            None,
        )
        .await
        .map_err(|_| ServiceError::BadRequest("Failed to create index".into()))?;

    qdrant_client
        .create_field_index(
            qdrant_collection,
            "time_stamp",
            FieldType::Integer,
            None,
            None,
        )
        .await
        .map_err(|_| ServiceError::BadRequest("Failed to create index".into()))?;

    qdrant_client
        .create_field_index(
            qdrant_collection,
            "group_ids",
            FieldType::Keyword,
            None,
            None,
        )
        .await
        .map_err(|_| ServiceError::BadRequest("Failed to create index".into()))?;

    Ok(())
}

#[tokio::main]
async fn main() -> Result<(), ServiceError> {
    create_new_qdrant_collection_query(
        "http://localhost:6333",
        "qdrant_api_key",
        "qdrant_collection",
    )
    .await?;
    Ok(())
}

import { Tooltip } from "shared/ui";
import { AiOutlineInfoCircle } from "solid-icons/ai";
import { For, Accessor } from "solid-js";
import { DatasetConfig } from "./LegacySettingsWrapper";
import {
  availableDistanceMetrics,
  availableEmbeddingModels,
} from "shared/types";

export const GeneralServerSettings = (props: {
  serverConfig: Accessor<DatasetConfig>;
  setServerConfig: (config: (prev: DatasetConfig) => DatasetConfig) => void;
}) => {
  return (
    <form class="flex flex-col gap-3">
      {/* General LLM Settings */}

      {/* Embedding Settings */}
      <div
        class="rounded-md border shadow sm:overflow-hidden"
        id="embedding-settings"
      >
        <div class="rounded-md bg-white px-4 py-6 sm:p-6">
          <div>
            <h2 id="user-details-name" class="text-xl font-medium leading-6">
              Embedding Settings
            </h2>
            <p class="mt-1 text-sm text-neutral-600">
              Configure the embedding model and query parameters.
            </p>
          </div>

          <div class="mt-6 grid grid-cols-4 gap-6">
            <div class="col-span-4 space-y-1 sm:col-span-2">
              <div class="flex items-center">
                <label
                  for="embeddingSize"
                  class="mr-2 block text-sm font-medium leading-6"
                >
                  Embedding Model
                </label>
                <Tooltip
                  direction="right"
                  body={<AiOutlineInfoCircle />}
                  tooltipText="Embedding Model is only editable on creation"
                />
              </div>
              <select
                id="embeddingSize"
                aria-readonly
                title="Embedding Model is only editable on creation"
                disabled
                name="embeddingSize"
                class="col-span-2 block w-full cursor-not-allowed rounded-md border-[0.5px] border-neutral-300 bg-white px-3 py-1.5 shadow-sm placeholder:text-neutral-400 focus:outline-magenta-500 sm:text-sm sm:leading-6"
                value={
                  availableEmbeddingModels.find(
                    (model) =>
                      model.id === props.serverConfig().EMBEDDING_MODEL_NAME,
                  )?.name ?? availableEmbeddingModels[0].name
                }
              >
                <For each={availableEmbeddingModels}>
                  {(model) => <option value={model.name}>{model.name}</option>}
                </For>
              </select>
            </div>

            <div class="col-span-4 space-y-1 sm:col-span-2">
              <div class="flex items-center">
                <label
                  for="embeddingSize"
                  class="mr-2 block text-sm font-medium leading-6"
                >
                  Embedding Query Prefix
                </label>
                <Tooltip
                  direction="right"
                  body={<AiOutlineInfoCircle />}
                  tooltipText="For some embedding models, the training data includes query prefixes. The default for Jina is 'Search for: '. You can experiment with different values."
                />
              </div>
              <input
                type="text"
                name="embeddingQueryPrefix"
                id="embeddingQueryPrefix"
                class="block w-full rounded-md border-[0.5px] border-neutral-300 px-3 py-1.5 shadow-sm placeholder:text-neutral-400 focus:outline-magenta-500 sm:text-sm sm:leading-6"
                value={props.serverConfig().EMBEDDING_QUERY_PREFIX || ""}
                onInput={(e) =>
                  props.setServerConfig((prev) => {
                    return {
                      ...prev,
                      EMBEDDING_QUERY_PREFIX: e.currentTarget.value,
                    };
                  })
                }
              />
            </div>

            <div class="col-span-4 space-y-1 sm:col-span-2">
              <div class="flex items-center">
                <label
                  for="embeddingSize"
                  class="mr-2 block text-sm font-medium leading-6"
                >
                  Distance Metric
                </label>
                <Tooltip
                  direction="right"
                  body={<AiOutlineInfoCircle />}
                  tooltipText="Distance Metric is only editable on creation"
                />
              </div>
              <select
                id="embeddingSize"
                aria-readonly
                title="Embedding Model is only editable on creation"
                disabled
                name="embeddingSize"
                class="col-span-2 block w-full cursor-not-allowed rounded-md border-[0.5px] border-neutral-300 bg-white px-3 py-1.5 shadow-sm placeholder:text-neutral-400 focus:outline-magenta-500 sm:text-sm sm:leading-6"
                value={
                  availableDistanceMetrics.find(
                    (metric) =>
                      metric.id === props.serverConfig().DISTANCE_METRIC,
                  )?.name ?? availableEmbeddingModels[0].name
                }
              >
                <For each={availableDistanceMetrics}>
                  {(metric) => (
                    <option value={metric.name}>{metric.name}</option>
                  )}
                </For>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Options */}
      <div
        class="rounded-md border shadow sm:overflow-hidden"
        id="additional-options"
      >
        <div class="rounded-md bg-white px-4 py-6 sm:p-6">
          <div>
            <h2 id="user-details-name" class="text-xl font-medium leading-6">
              Additional Options
            </h2>
            <p class="mt-1 text-sm text-neutral-600">
              Fine-tune server and model settings.
            </p>
          </div>

          <div class="mt-6 grid grid-cols-4 gap-6">
            <div class="col-span-4 sm:col-span-2">
              <label
                for="nRetreivalsToInclude"
                class="block text-sm font-medium leading-6"
              >
                Documents to include for RAG
              </label>
              <input
                name="nRetreivalsToInclude"
                type="number"
                placeholder="something"
                id="linesBeforeShowMore"
                class="block w-full rounded-md border-[0.5px] border-neutral-300 px-3 py-1.5 shadow-sm placeholder:text-neutral-400 focus:outline-magenta-500 sm:text-sm sm:leading-6"
                value={props.serverConfig().N_RETRIEVALS_TO_INCLUDE?.toString()}
                onChange={(e) =>
                  props.setServerConfig((prev) => {
                    return {
                      ...prev,
                      N_RETRIEVALS_TO_INCLUDE: parseFloat(
                        e.currentTarget.value,
                      ),
                    };
                  })
                }
              />
            </div>

            <div class="col-span-4 sm:col-span-2">
              <div class="flex flex-row items-center gap-2">
                <label
                  for="maxLimit"
                  class="block text-sm font-medium leading-6"
                >
                  Max Count Limit
                </label>
                <Tooltip
                  direction="right"
                  body={<AiOutlineInfoCircle />}
                  tooltipText="Sets the maximum limit when counting chunks, applies to search and count routes in the API to prevent DDOS attacks on the server."
                />
              </div>
              <input
                type="number"
                name="maxLimit"
                id="linesBeforeShowMore"
                class="block w-full rounded-md border-[0.5px] border-neutral-300 px-3 py-1.5 shadow-sm placeholder:text-neutral-400 focus:outline-magenta-500 sm:text-sm sm:leading-6"
                value={props.serverConfig().MAX_LIMIT ?? 0}
                onChange={(e) =>
                  props.setServerConfig((prev) => {
                    return {
                      ...prev,
                      MAX_LIMIT: e.currentTarget.valueAsNumber,
                    };
                  })
                }
              />
            </div>

            <div class="col-span-4 flex items-center space-x-2 sm:col-span-2">
              <input
                type="checkbox"
                name="semanticEnabled"
                id="semanticEnabled"
                checked={!!props.serverConfig().SEMANTIC_ENABLED}
                onInput={(e) =>
                  props.setServerConfig((prev) => {
                    return {
                      ...prev,
                      SEMANTIC_ENABLED: e.currentTarget.checked,
                    };
                  })
                }
              />
              <label
                for="semanticEnabled"
                class="block text-sm font-medium leading-6"
              >
                Semantic Enabled
              </label>
            </div>

            <div class="col-span-4 flex items-center space-x-2 sm:col-span-2">
              <input
                type="checkbox"
                name="lockDataset"
                id="lockDataset"
                checked={!!props.serverConfig().LOCKED}
                onInput={(e) =>
                  props.setServerConfig((prev) => {
                    return {
                      ...prev,
                      LOCKED: e.currentTarget.checked,
                    };
                  })
                }
              />
              <label for="lockDataset" class="block text-sm font-medium">
                Lock dataset
              </label>
            </div>

            <div class="col-span-4 flex items-center space-x-2 sm:col-span-2">
              <input
                type="checkbox"
                name="fullTextEnabled"
                id="fullTextEnabled"
                checked={!!props.serverConfig().FULLTEXT_ENABLED}
                onInput={(e) =>
                  props.setServerConfig((prev) => {
                    return {
                      ...prev,
                      FULLTEXT_ENABLED: e.currentTarget.checked,
                    };
                  })
                }
              />
              <label
                for="fullTextEnabled"
                class="block text-sm font-medium leading-6"
              >
                Fulltext Enabled
              </label>
            </div>

            <div class="col-span-4 flex items-center space-x-2 sm:col-span-2">
              <input
                type="checkbox"
                name="indexedOnly"
                id="indexedOnly"
                checked={!!props.serverConfig().INDEXED_ONLY}
                onInput={(e) =>
                  props.setServerConfig((prev) => {
                    return {
                      ...prev,
                      INDEXED_ONLY: e.currentTarget.checked,
                    };
                  })
                }
              />
              <div class="flex items-center">
                <label
                  for="embeddingSize"
                  class="mr-2 block text-sm font-medium leading-6"
                >
                  Indexed Only
                </label>
                <Tooltip
                  direction="right"
                  body={<AiOutlineInfoCircle />}
                  tooltipText="If enabled, only indexed documents will be returned in search results."
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
import { DatasetConfigurationDTO } from "trieve-ts-sdk";
import { DatasetContext } from "../../contexts/DatasetContext";
import { defaultServerEnvsConfiguration } from "../../utils/serverEnvs";
import { createToast } from "../ShowToasts";
import {
  Accessor,
  createEffect,
  createResource,
  JSX,
  createSignal,
  Show,
  useContext,
} from "solid-js";
import { ApiContext } from "../../api/trieve";

export type DatasetConfig = Exclude<
  DatasetConfigurationDTO,
  "PUBLIC_DATASET"
> & {
  LLM_API_KEY?: string | null;
  PUBLIC_DATASET?: {
    enabled: boolean;
    api_key: string;
  };
};

type SettingsPage = (args: {
  serverConfig: Accessor<DatasetConfig>;
  setServerConfig: (config: (prev: DatasetConfig) => DatasetConfig) => void;
}) => JSX.Element;

export const LegacySettingsWrapper = (props: { page: SettingsPage }) => {
  const datasetContext = useContext(DatasetContext);
  const trieve = useContext(ApiContext);

  const [dataset] = createResource(async () => {
    return trieve.fetch("/api/dataset/{dataset_id}", "get", {
      datasetId: datasetContext.datasetId(),
    });
  });

  const [originalConfig, setOriginalConfig] = createSignal<DatasetConfig>(
    dataset()?.server_configuration || defaultServerEnvsConfiguration,
  );

  const [serverConfig, setServerConfig] = createSignal<DatasetConfig>(
    dataset()?.server_configuration || defaultServerEnvsConfiguration,
  );

  createEffect(() => {
    const newConfig = dataset()?.server_configuration as DatasetConfig;
    setOriginalConfig(newConfig);
    setServerConfig(newConfig);
  });

  const getModifiedFields = () => {
    const modified: Partial<DatasetConfig> = {};
    const original = originalConfig();
    const current = serverConfig();

    Object.keys(current).forEach((key) => {
      if (
        JSON.stringify(current[key as keyof DatasetConfig]) !==
        JSON.stringify(original[key as keyof DatasetConfig])
      ) {
        modified[key as keyof DatasetConfig] = current[
          key as keyof DatasetConfig
        ] as undefined;
      }
    });

    return modified;
  };

  const onSave = () => {
    const datasetId = datasetContext.dataset()?.dataset.id;
    if (!datasetId) return;

    const originalServerConfig = serverConfig();
    const modifiedFields = getModifiedFields();

    if (Object.keys(modifiedFields).length === 0) {
      createToast({
        title: "Info",
        type: "info",
        message: "No changes to save",
      });
      return;
    }

    void fetch(`${import.meta.env.VITE_API_HOST}/dataset`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "TR-Dataset": datasetId,
      },
      credentials: "include",
      body: JSON.stringify({
        dataset_id: datasetContext.dataset()?.dataset.id,
        server_configuration: modifiedFields,
      }),
    })
      .then((resp) => {
        if (resp.ok) {
          createToast({
            title: "Success",
            type: "success",
            message: "Dataset Configuration Saved",
          });
          setOriginalConfig(originalServerConfig);
          return;
        }

        if (!resp.ok) {
          let message = "Error Saving Dataset Configuration";
          if (resp.status === 403) {
            message =
              "You must have owner permissions to modify dataset settings";
          }

          createToast({
            title: "Error",
            type: "error",
            message: message,
          });
        }
      })
      .catch((err) => {
        console.error(err);
      });
  };

  return (
    <div class="flex flex-col items-stretch gap-4">
      <Show when={serverConfig()}>
        <div>
          {props.page({
            serverConfig: serverConfig,
            setServerConfig: setServerConfig,
          })}
        </div>
        <button
          class="mt-4 self-end rounded-md bg-magenta-400 px-2 py-1 text-white"
          onClick={() => {
            onSave();
          }}
        >
          Save
        </button>
      </Show>
    </div>
  );
};

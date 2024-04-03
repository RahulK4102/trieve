import { TbDatabasePlus } from "solid-icons/tb";
import { Show, For, Setter, Accessor, createEffect } from "solid-js";
import { DatasetAndUsage } from "../types/apiTypes";
import { useNavigate } from "@solidjs/router";
import { FiTrash } from "solid-icons/fi";
import { FaSolidGear } from "solid-icons/fa";

export interface DatasetOverviewProps {
  setOpenNewDatasetModal: Setter<boolean>;
  datasetAndUsages: Accessor<DatasetAndUsage[]>;
  setDatasetsAndUsages: Setter<DatasetAndUsage[]>;
}

export const DatasetOverview = (props: DatasetOverviewProps) => {
  const navigate = useNavigate();
  const deleteDataset = (datasetId: string) => {
    const api_host = import.meta.env.VITE_API_HOST as unknown as string;
    const currentDatasetsAndUsages = props.datasetAndUsages();
    void fetch(`${api_host}/dataset/${datasetId}`, {
      method: "DELETE",
      headers: {
        "TR-Dataset": datasetId,
        "Content-Type": "application/json",
      },
      credentials: "include",
    }).then(() => {
      const newDatasetAndUsages = currentDatasetsAndUsages.filter(
        (datasetAndUsage) => datasetAndUsage.dataset.id !== datasetId,
      );

      createEffect(() => {
        props.setDatasetsAndUsages(newDatasetAndUsages);
      });
    });
  };
  return (
    <>
      <div class="flex items-center">
        <div class="flex w-full justify-between pt-2">
          <div>
            <h1 class="text-base font-semibold leading-6">Datasets</h1>
            <p class="mt-2 text-sm text-neutral-700">
              {" "}
              A list of all the datasets{" "}
            </p>
          </div>
          <Show when={props.datasetAndUsages().length != 0}>
            <div class="end-2 right-2 content-end justify-end text-end">
              <button
                class="justify-end rounded-md bg-magenta-500 p-2 text-white"
                onClick={() => props.setOpenNewDatasetModal(true)}
              >
                Create Dataset +
              </button>
            </div>
          </Show>
        </div>
      </div>
      <Show when={props.datasetAndUsages().length == 0}>
        <button
          onClick={() => props.setOpenNewDatasetModal(true)}
          class="relative block w-full rounded-lg border-2 border-dashed border-neutral-300 p-12 text-center hover:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-magenta-500 focus:ring-offset-2"
        >
          <TbDatabasePlus class="mx-auto h-12 w-12 text-magenta" />
          <span class="ont-semibold mt-2 block">Create a new dataset</span>
        </button>
      </Show>
      <Show when={props.datasetAndUsages().length > 0}>
        <div class="mt-8 flow-root">
          <div class="overflow-hidden rounded shadow ring-1 ring-black ring-opacity-5">
            <table class="min-w-full divide-y divide-neutral-300">
              <thead class="w-full min-w-full bg-neutral-100">
                <tr>
                  <th
                    scope="col"
                    class="py-3.5 pl-6 pr-3 text-left text-sm font-semibold"
                  >
                    Name
                  </th>
                  <th
                    scope="col"
                    class="px-3 py-3.5 text-left text-sm font-semibold"
                  >
                    Chunk Count
                  </th>
                  <th
                    scope="col"
                    class="hidden w-full px-3 py-3.5 text-left text-sm font-semibold lg:block"
                  >
                    ID
                  </th>
                  <th class="sr-only">Delete</th>
                  <th />
                </tr>
              </thead>
              <tbody class="divide-y divide-neutral-200 bg-white">
                <For each={props.datasetAndUsages()}>
                  {(datasetAndUsage) => (
                    <tr class="cursor-pointer hover:bg-neutral-100">
                      <td
                        class="whitespace-nowrap py-4 pl-6 pr-3 text-sm font-medium"
                        onClick={() => {
                          navigate(
                            `/dashboard/dataset/${datasetAndUsage.dataset.id}/start`,
                          );
                        }}
                      >
                        {datasetAndUsage.dataset.name}
                      </td>
                      <td
                        class="whitespace-nowrap px-3 py-4 text-sm text-neutral-600"
                        onClick={() => {
                          navigate(
                            `/dashboard/dataset/${datasetAndUsage.dataset.id}/start`,
                          );
                        }}
                      >
                        {datasetAndUsage.dataset_usage.chunk_count}
                      </td>
                      <td
                        class="hidden whitespace-nowrap px-3 py-4 text-sm text-neutral-600 lg:block"
                        onClick={() => {
                          navigate(
                            `/dashboard/dataset/${datasetAndUsage.dataset.id}/start`,
                          );
                        }}
                      >
                        {datasetAndUsage.dataset.id}
                      </td>
                      <td class="whitespace-nowrap py-4 text-right text-sm font-medium">
                        <button
                          class="text-lg text-neutral-500 hover:text-neutral-900"
                          onClick={() => {
                            navigate(
                              `/dashboard/dataset/${datasetAndUsage.dataset.id}/settings`,
                            );
                          }}
                        >
                          <FaSolidGear />
                        </button>
                        <button
                          class="px-3 text-lg text-red-500 hover:text-neutral-900"
                          onClick={() => {
                            confirm(
                              "Are you sure you want to delete this dataset?",
                            ) && deleteDataset(datasetAndUsage.dataset.id);
                          }}
                        >
                          <FiTrash />
                        </button>
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>
        </div>
      </Show>
    </>
  );
};

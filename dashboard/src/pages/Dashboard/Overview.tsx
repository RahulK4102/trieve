import {
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  useContext,
} from "solid-js";
import { UserContext } from "../../contexts/UserContext";
import {
  DatasetAndUsage,
  OrganizationUsageCount,
  OrganizationAndSubAndPlan,
} from "../../types/apiTypes";
import NewDatasetModal from "../../components/NewDatasetModal";
import { DatasetOverview } from "../../components/DatasetOverview";
import { OrganizationUsageOverview } from "../../components/OrganizationUsageOverview";
import { BiRegularInfoCircle, BiRegularLinkExternal } from "solid-icons/bi";
import { FaRegularClipboard } from "solid-icons/fa";

export const Overview = () => {
  const api_host = import.meta.env.VITE_API_HOST as unknown as string;

  const userContext = useContext(UserContext);
  const [datasetAndUsages, setDatasetsAndUsages] = createSignal<
    DatasetAndUsage[]
  >([]);
  const [orgSubPlan, setOrgSubPlan] = createSignal<OrganizationAndSubAndPlan>();
  const [orgUsage, setOrgUsage] = createSignal<OrganizationUsageCount>();
  const [newDatasetModalOpen, setNewDatasetModalOpen] =
    createSignal<boolean>(false);

  const selectedOrganization = createMemo(() => {
    const selectedOrgId = userContext.selectedOrganizationId?.();
    if (!selectedOrgId) return null;
    return userContext.user?.()?.orgs.find((org) => org.id === selectedOrgId);
  });

  createEffect(() => {
    const selectedOrgId = selectedOrganization()?.id;
    if (!selectedOrgId) return;

    const datasetAndUsageAbortController = new AbortController();
    void fetch(`${api_host}/dataset/organization/${selectedOrgId}`, {
      credentials: "include",
      headers: {
        "TR-Organization": selectedOrgId,
      },
      signal: datasetAndUsageAbortController.signal,
    })
      .then((res) => res.json())
      .then((data) => {
        setDatasetsAndUsages(data);
      });

    const orgSubPlanAbortController = new AbortController();
    void fetch(`${api_host}/organization/${selectedOrgId}`, {
      credentials: "include",
      headers: {
        "TR-Organization": selectedOrgId,
      },
      signal: orgSubPlanAbortController.signal,
    })
      .then((res) => res.json())
      .then((data) => {
        setOrgSubPlan(data);
      });

    const orgUsageAbortController = new AbortController();
    void fetch(`${api_host}/organization/usage/${selectedOrgId}`, {
      credentials: "include",
      headers: {
        "TR-Organization": selectedOrgId,
      },
      signal: orgUsageAbortController.signal,
    })
      .then((res) => res.json())
      .then((data) => {
        setOrgUsage(data);
      });

    onCleanup(() => {
      datasetAndUsageAbortController.abort();
      orgSubPlanAbortController.abort();
      orgUsageAbortController.abort();
    });
  });

  return (
    <div class="pt-8">
      <section
        class="mb-4 flex-col space-y-4 bg-white px-4 py-6 shadow sm:overflow-hidden sm:rounded-md sm:p-6 lg:col-span-2"
        aria-labelledby="organization-details-name"
      >
        <div class="flex items-center space-x-4">
          <h2 id="user-details-name" class="text-lg font-medium leading-6">
            Create a Dataset Below to Get Started!
          </h2>
          <a
            class="flex items-center space-x-2 rounded-md bg-neutral-100 px-2 py-1 text-sm"
            href="https://docs.arguflow.ai"
            target="_blank"
          >
            <p>API Docs</p>
            <BiRegularLinkExternal class="h-4 w-4" />
          </a>
        </div>
        <div class="flex w-fit space-x-4 rounded-md bg-blue-50 px-6 py-4">
          <BiRegularInfoCircle class="h-5 w-5 text-blue-400" />
          <p class="text-sm text-blue-700">
            Building something? Share in our{" "}
            <a class="underline" href="https://discord.gg/s4CX3vczyn">
              Discord
            </a>{" "}
            or{" "}
            <a
              class="underline"
              href="https://matrix.to/#/#trieve-general:matrix.zerodao.gg"
            >
              Matrix
            </a>
            ; we would love to hear about it!
          </p>
        </div>
        <div class="flex flex-col space-y-2">
          <div class="flex items-center space-x-3">
            <p class="block text-sm font-medium">
              {selectedOrganization()?.name} org id:
            </p>
            <p class="w-fit text-sm">{selectedOrganization()?.id}</p>
            <button
              class="text-sm underline"
              onClick={() => {
                void navigator.clipboard.writeText(
                  selectedOrganization()?.id ?? "",
                );
                window.dispatchEvent(
                  new CustomEvent("show-toast", {
                    detail: {
                      type: "info",
                      title: "Copied",
                      message: "Organization ID copied to clipboard",
                    },
                  }),
                );
              }}
            >
              <FaRegularClipboard />
            </button>
          </div>
        </div>
      </section>

      <OrganizationUsageOverview
        organization={orgSubPlan}
        orgUsage={orgUsage}
      />
      <DatasetOverview
        setOpenNewDatasetModal={setNewDatasetModalOpen}
        datasetAndUsages={datasetAndUsages}
        setDatasetsAndUsages={setDatasetsAndUsages}
      />
      <NewDatasetModal
        isOpen={newDatasetModalOpen}
        closeModal={() => {
          setNewDatasetModalOpen(false);
        }}
      />
    </div>
  );
};

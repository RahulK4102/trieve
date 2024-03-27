import { For, createMemo, createSignal, useContext } from "solid-js";
import { UserContext } from "../contexts/UserContext";
import { useNavigate } from "@solidjs/router";
import { IoLogOutOutline, IoOpenOutline } from "solid-icons/io";
import { AiOutlinePlus, AiOutlineUser } from "solid-icons/ai";
import CreateNewOrgModal from "./CreateNewOrgModal";

export const Sidebar = () => {
  const apiHost = import.meta.env.VITE_API_HOST as string;
  const searchUiURL = import.meta.env.VITE_SEARCH_UI_URL as string;
  const chatUiURL = import.meta.env.VITE_CHAT_UI_URL as string;
  const navigate = useNavigate();
  const userContext = useContext(UserContext);

  const [showNewOrgModal, setShowNewOrgModal] = createSignal(false);

  const organizations = createMemo(() => userContext?.user?.()?.orgs ?? []);

  return (
    <>
      <div class="flex min-h-[calc(100vh-65px)] w-full max-w-[280px] flex-col justify-between border-r">
        <div class="flex flex-col">
          <div class="border-b px-4 py-3">
            <h5 class="mb-2 mt-2 font-semibold text-neutral-600">
              Organizations
            </h5>
            <div class="flex flex-col items-start space-y-1">
              <For each={organizations()}>
                {(org) => (
                  <button
                    onClick={() => {
                      userContext.setSelectedOrganizationId(org.id);
                      navigate(`/dashboard/overview`);
                    }}
                    classList={{
                      "block hover:text-fuchsia-800": true,
                      "text-magenta":
                        userContext.selectedOrganizationId?.() === org.id,
                    }}
                  >
                    {org.name}
                  </button>
                )}
              </For>
            </div>
            <button
              class="mt-4 flex items-center gap-x-2 rounded-md border border-neutral-300 px-2 py-1 text-sm hover:border-fuchsia-800 hover:text-fuchsia-800"
              onClick={() => setShowNewOrgModal(true)}
            >
              <AiOutlinePlus class="inline-block h-4 w-4" />{" "}
              <p>New Organization</p>
            </button>
          </div>
          <div class="border-b px-4 py-3">
            <h5 class="my-2 font-semibold text-neutral-600">Admin Tools</h5>
            <div class="flex flex-col items-start space-y-1">
              <div class="flex items-center text-neutral-800 hover:text-fuchsia-800">
                <a href={searchUiURL} class="flex items-center">
                  Search <IoOpenOutline class="ml-1 inline-block h-4 w-4" />
                </a>
              </div>
              <div class="flex items-center text-neutral-800 hover:text-fuchsia-800">
                <a href={chatUiURL} class="flex items-center">
                  <span>RAG chat</span>{" "}
                  <IoOpenOutline class="ml-1 inline-block h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
        <div class="sticky-bottom h-[100px] border-t px-4 py-3">
          <div class="flex items-center space-x-1">
            <p>{userContext?.user?.()?.email}</p>
            <AiOutlineUser class="h-4 w-4" />
          </div>
          <button
            class="hover:text-fuchsia-800"
            onClick={() => {
              void fetch(`${apiHost}/auth?redirect_uri=${window.origin}`, {
                method: "DELETE",
                credentials: "include",
              }).then((res) => {
                res
                  .json()
                  .then((res) => {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                    window.location.href = res.logout_url;
                  })
                  .catch(() => {
                    console.log("error");
                  });
              });
            }}
          >
            Logout <IoLogOutOutline class="inline-block h-4 w-4" />
          </button>
        </div>
      </div>
      <CreateNewOrgModal
        isOpen={showNewOrgModal}
        closeModal={() => setShowNewOrgModal(false)}
      />
    </>
  );
};

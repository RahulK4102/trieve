import { Show } from "solid-js";
import {
  BsBook,
  BsDiscord,
  BsEnvelope,
  BsGithub,
  BsQuestionCircle,
  BsSignal,
  BsSunglasses,
} from "solid-icons/bs";
import { Popover, PopoverButton, PopoverPanel } from "terracotta";
import { useNavigate } from "@solidjs/router";

export const NavBar = () => {
  const navigator = useNavigate();

  return (
    <div class="flex justify-between space-x-3">
      <a href="/dashboard/overview" class="flex items-center space-x-1">
        <img
          class="h-12 w-12 cursor-pointer"
          src="https://cdn.trieve.ai/trieve-logo.png"
          alt="Logo"
          onClick={() => {
            navigator("/dashboard/overview");
          }}
        />
        <span class="text-2xl font-semibold">Trieve</span>
      </a>
      <div class="flex items-center justify-end space-x-3">
        <Popover
          id="help-or-contact-popover"
          defaultOpen={false}
          class="relative flex items-center"
        >
          {({ isOpen }) => (
            <>
              <PopoverButton
                aria-label="Show help or contact"
                class="flex items-center space-x-2 rounded-md bg-neutral-100 px-2 py-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-600"
              >
                <BsQuestionCircle class="h-3 w-3" />
                <span>Help or Contact</span>
              </PopoverButton>
              <Show when={isOpen()}>
                <PopoverPanel class="absolute right-0 top-full z-10 mt-1 w-fit min-w-[350px] space-y-2 rounded-md bg-neutral-100 px-3 py-2 shadow-lg">
                  <div class="text-nowrap">
                    <h5 class="my-3 text-lg font-semibold">
                      Need help or just want to chat?
                    </h5>
                    <p class="my-2 text-sm font-semibold text-neutral-800">
                      Call a dev or see docs for assistance with your hosted
                      search platform or other inquiries.{" "}
                      <span class="underline">Signal</span>, WhatsApp, or
                      Telegram all work.
                    </p>
                    <div class="my-2 flex items-center space-x-2 text-sm">
                      <a
                        href="tel:6282224090"
                        class="flex items-center space-x-1 rounded-md border-[0.5px] border-magenta-200 bg-magenta-50 px-2 py-1 font-medium"
                      >
                        <BsSignal class="h-3 w-3" />
                        <p>+1 628-222-4090</p>
                      </a>
                      <a
                        href="https://docs.trieve.ai/"
                        class="flex items-center space-x-1 px-2 py-1 font-medium"
                      >
                        <BsBook class="h-3 w-3" /> <p>Docs</p>
                      </a>
                    </div>
                    <p class="my-2 text-sm font-semibold text-neutral-800">
                      Expected performance is based on your billing plan. Paid
                      projects are prioritized.
                    </p>
                    <a
                      href="mailto:help@arguflow.ai"
                      class="flex w-fit items-center space-x-1 rounded-md border-[0.5px] border-magenta-200 bg-magenta-50 px-2 py-1 text-sm font-medium"
                    >
                      <BsEnvelope class="h-3 w-3" />
                      <p>humans@trieve.ai</p>
                    </a>
                  </div>
                  <div>
                    <h5 class="my-3 text-lg font-semibold">
                      Reach out to the community
                    </h5>
                    <p class="my-2 text-sm font-semibold text-neutral-800">
                      Welcoming space for other support or advice, including
                      questions on API concepts, or best practices.
                    </p>
                    <div class="my-2 flex items-center space-x-2 text-sm">
                      <a
                        href="https://matrix.to/#/#trieve-general:matrix.zerodao.gg"
                        class="flex w-fit items-center space-x-1 rounded-md border-[0.5px] border-green-100 bg-white px-2 py-1 text-sm font-medium text-green-900"
                      >
                        <BsSunglasses class="h-3 w-3" />
                        <p>Join Matrix server</p>
                      </a>
                      <a
                        href="https://github.com/devflowinc/trieve/issues"
                        class="flex w-fit items-center space-x-1 rounded-md border-[0.5px] border-sky-100 bg-white px-2 py-1 text-sm font-medium text-sky-900"
                      >
                        <BsGithub class="h-3 w-3" />
                        <p>GitHub Issues</p>
                      </a>
                    </div>
                    <a
                      href="https://discord.gg/E9sPRZqpDT"
                      class="flex w-fit items-center space-x-1 rounded-md border-[0.5px] border-blue-100 bg-white px-2 py-1 text-sm font-medium text-blue-900"
                    >
                      <BsDiscord class="h-3 w-3" />
                      <p>Join Discord server</p>
                    </a>
                  </div>
                </PopoverPanel>
              </Show>
            </>
          )}
        </Popover>
      </div>
    </div>
  );
};

export default NavBar;

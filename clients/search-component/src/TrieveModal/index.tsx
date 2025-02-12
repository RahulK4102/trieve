import React, { useEffect, lazy, startTransition } from "react";
import r2wc from "@r2wc/react-to-web-component";
const SearchMode = lazy(() => import("./Search/SearchMode"));
const ChatMode = lazy(() => import("./Chat/ChatMode"));

import {
  ModalProps,
  ModalProvider,
  useModalState,
} from "../utils/hooks/modal-context";
import { useKeyboardNavigation } from "../utils/hooks/useKeyboardNavigation";
import { ModeSwitch } from "./ModeSwitch";
import { OpenModalButton } from "./OpenModalButton";
import { ChatProvider } from "../utils/hooks/chat-context";

const Modal = () => {
  useKeyboardNavigation();
  const { mode, open, setOpen, setMode, props } = useModalState();

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--tv-prop-brand-color",
      props.brandColor ?? "#CB53EB",
    );

    // depending on the theme, set the background color of ::-webkit-scrollbar-thumb for #trieve-search-modal
    if (props.theme === "dark") {
      document.documentElement.style.setProperty(
        "--tv-prop-scrollbar-thumb-color",
        "var(--tv-zinc-700)",
      );
    } else {
      document.documentElement.style.setProperty(
        "--tv-prop-scrollbar-thumb-color",
        "var(--tv-zinc-300)",
      );
    }
  }, [props.brandColor]);

  return (
    <>
      <OpenModalButton setOpen={() => {
        startTransition(() => {
          setOpen(true)
          setMode(props.defaultSearchMode || "search");
        })
      }} />
      {open &&
        <>
          <div
            onClick={() => {
              setOpen(false)
            }}
            id="trieve-search-modal-overlay"></div>
          <div
            id="trieve-search-modal"
            className={
              (mode === "chat" ? "chat-modal-mobile " : " ") +
              (props.theme === "dark" ? "dark " : "")
            }>
            {props.allowSwitchingModes && <ModeSwitch />}
            <div style={{ display: mode === "search" ? "block" : "none" }}>
              <SearchMode />
            </div>
            <div
              className={mode === "chat" ? " chat-container" : " "}
              style={{ display: mode === "chat" ? "block" : "none" }}>
              <ChatMode />
            </div>
          </div>
        </>
      }
    </>
  );
};

export const initTrieveModalSearch = (props: ModalProps) => {
  const ModalSearchWC = r2wc(() => <TrieveModalSearch {...props} />);

  if (!customElements.get("trieve-modal-search")) {
    customElements.define("trieve-modal-search", ModalSearchWC);
  }
};

export const TrieveModalSearch = (props: ModalProps) => {
  return (
    <ModalProvider onLoadProps={props}>
      <ChatProvider>
        <Modal />
      </ChatProvider>
    </ModalProvider>
  );
};

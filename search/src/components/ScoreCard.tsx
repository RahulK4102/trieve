import {
  Accessor,
  For,
  Setter,
  Show,
  createEffect,
  createMemo,
  createSignal,
} from "solid-js";
import {
  indirectHasOwnProperty,
  type CardBookmarksDTO,
  type CardCollectionDTO,
  type CardMetadataWithVotes,
} from "../../utils/apiTypes";
import { BiRegularChevronDown, BiRegularChevronUp } from "solid-icons/bi";
import { RiOthersCharacterRecognitionLine } from "solid-icons/ri";
import BookmarkPopover from "./BookmarkPopover";
import { VsFileSymlinkFile } from "solid-icons/vs";
import sanitizeHtml from "sanitize-html";
import { FiEdit, FiTrash, FiCheck } from "solid-icons/fi";
import {
  FaRegularFileCode,
  FaRegularFileImage,
  FaRegularFilePdf,
} from "solid-icons/fa";
import { Tooltip } from "./Atoms/Tooltip";
import { AiOutlineCopy } from "solid-icons/ai";
import CommunityBookmarkPopover from "./CommunityBookmarkPopover";
import { FullScreenModal } from "./Atoms/FullScreenModal";

export const sanitzerOptions = {
  allowedTags: [...sanitizeHtml.defaults.allowedTags, "font", "button", "span"],
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    "*": ["style"],
    button: ["onclick"],
  },
};

export const formatDate = (date: Date) => {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();

  const formattedMonth = month < 10 ? `0${month}` : month;
  const formattedDay = day < 10 ? `0${day}` : day;

  return `${formattedMonth}/${formattedDay}/${year}`;
};

export interface ScoreCardProps {
  signedInUserId?: string;
  cardCollections?: CardCollectionDTO[];
  totalCollectionPages?: number;
  collection?: boolean;
  card: CardMetadataWithVotes;
  score: number;
  setShowModal?: Setter<boolean>;
  setOnDelete?: Setter<() => void>;
  setShowConfirmModal?: Setter<boolean>;
  initialExpanded?: boolean;
  bookmarks?: CardBookmarksDTO[];
  showExpand?: boolean;
  setCardCollections?: Setter<CardCollectionDTO[]>;
  counter: string;
  order?: string;
  total: number;
  begin: number | undefined;
  end: number | undefined;
  setSelectedIds: Setter<string[]>;
  selectedIds: Accessor<string[]>;
  chat?: boolean;
}

const ScoreCard = (props: ScoreCardProps) => {
  const dataset = import.meta.env.PUBLIC_DATASET as string;
  const apiHost = import.meta.env.PUBLIC_API_HOST as string;

  const frontMatterVals = (
    (import.meta.env.PUBLIC_FRONTMATTER_VALS as string | undefined) ??
    "link,tag_set,time_stamp"
  ).split(",");

  const linesBeforeShowMore = (() => {
    const parsedLinesBeforeShowMore = Number.parseInt(
      (import.meta.env.PUBLIC_LINES_BEFORE_SHOW_MORE as string | undefined) ??
        "4",
      10,
    );
    return Number.isNaN(parsedLinesBeforeShowMore)
      ? 4
      : parsedLinesBeforeShowMore;
  })();

  const [expanded, setExpanded] = createSignal(props.initialExpanded ?? false);
  const [showPropsModal, setShowPropsModal] = createSignal(false);
  const [deleting, setDeleting] = createSignal(false);
  const [deleted, setDeleted] = createSignal(false);
  const [copied, setCopied] = createSignal(false);
  const [showImageModal, setShowImageModal] = createSignal(false);
  const [showMetadata, setShowMetadata] = createSignal(false);

  const imgInformation = createMemo(() => {
    const imgRangeStartKey = import.meta.env
      .PUBLIC_IMAGE_RANGE_START_KEY as string;
    const imgRangeEndKey = import.meta.env.PUBLIC_IMAGE_RANGE_END_KEY as string;

    if (
      !imgRangeStartKey ||
      !props.card.metadata ||
      !indirectHasOwnProperty(props.card.metadata, imgRangeStartKey) ||
      !indirectHasOwnProperty(props.card.metadata, imgRangeEndKey)
    ) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
    const imgRangeStartVal = (props.card.metadata as any)[
      imgRangeStartKey
    ] as unknown as string;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
    const imgRangeEndVal = (props.card.metadata as any)[
      imgRangeEndKey
    ] as unknown as string;
    const imgRangeStart = parseInt(imgRangeStartVal.replace(/\D+/g, ""), 10);
    const imgRangeEnd = parseInt(imgRangeEndVal.replace(/\D+/g, ""), 10);
    const imgRangePrefix = imgRangeStartVal.slice(
      0,
      -imgRangeStart.toString().length,
    );

    return {
      imgRangeStart,
      imgRangeEnd,
      imgRangePrefix,
    };
  });

  createEffect(() => {
    if (!showPropsModal() || !props.setShowModal) return;

    props.setShowModal(true);
    setShowPropsModal(false);
  });

  const deleteCard = () => {
    if (!props.setOnDelete) return;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (props.signedInUserId !== props.card.author?.id) return;

    const curCardMetadataId = props.card.id;

    props.setOnDelete(() => {
      return () => {
        setDeleting(true);
        void fetch(`${apiHost}/card/${curCardMetadataId}`, {
          method: "DELETE",
          headers: {
            "AF-Dataset": dataset,
          },
          credentials: "include",
        }).then((response) => {
          setDeleting(false);
          if (response.ok) {
            setDeleted(true);
            return;
          }
          alert("Failed to delete card");
        });
      };
    });

    props.setShowConfirmModal?.(true);
  };

  const copyCard = () => {
    navigator.clipboard
      .write([
        new ClipboardItem({
          "text/html": new Blob([props.card.card_html ?? ""], {
            type: "text/html",
          }),
          "text/plain": new Blob([props.card.content], {
            type: "text/plain",
          }),
        }),
      ])
      .then(() => {
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
        }, 2000);
      })
      .catch((err: string) => {
        alert("Failed to copy to clipboard: " + err);
      });
  };

  const useExpand = createMemo(() => {
    return props.card.content.split(" ").length > 20 * linesBeforeShowMore;
  });

  return (
    <>
      <Show when={!deleted()}>
        <div
          class="mx-auto flex w-full max-w-[calc(100%-32px)] flex-col items-center rounded-md bg-neutral-100 p-2 dark:!bg-neutral-800 min-[360px]:max-w-[calc(100%-64px)]"
          id={
            "doc_" +
            (props.chat ? (props.order ?? "") + props.counter : props.card.id)
          }
        >
          <div class="flex w-full flex-col space-y-2">
            <div class="flex h-fit items-center space-x-1">
              <Show when={!props.chat}>
                <input
                  id="default-checkbox"
                  type="checkbox"
                  onClick={() => {
                    const cardId = props.card.id;
                    props.setSelectedIds((prev) => {
                      if (prev.includes(cardId)) {
                        return prev.filter((id) => id !== cardId);
                      }
                      return [...prev, cardId];
                    });
                  }}
                  checked={props.selectedIds().includes(props.card.id)}
                  class="h-4 w-4 rounded border-gray-300 bg-gray-100 text-green-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-blue-600"
                />
              </Show>
              <Show when={props.total > 1}>
                <span class="font-semibold">
                  {props.counter} of {props.total} duplicates
                  <Show when={props.begin && props.end}>
                    {props.begin != props.end ? " between" : " on"}{" "}
                    {formatDate(new Date(props.begin ?? 0))}
                    {props.begin != props.end &&
                      ` and ${formatDate(new Date(props.end ?? 0))}`}
                  </Show>
                </span>
              </Show>
              <Show when={props.chat}>
                <span class="font-semibold">
                  Doc: {props.counter.toString()}
                </span>
              </Show>
              <div class="flex-1" />
              <Tooltip
                body={
                  <Show when={imgInformation()}>
                    <button
                      class="h-fit"
                      onClick={() => setShowImageModal(true)}
                      title="View Images"
                    >
                      <FaRegularFileImage class="h-5 w-5 fill-current" />
                    </button>
                  </Show>
                }
                tooltipText="View Full Document"
              />
              <Tooltip
                body={
                  <Show when={imgInformation()}>
                    <a
                      class="h-fit"
                      href={`${apiHost}/pdf_from_range/${
                        imgInformation()?.imgRangeStart ?? 0
                      }/${imgInformation()?.imgRangeEnd ?? 0}/${
                        imgInformation()?.imgRangePrefix ?? ""
                      }/${
                        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                        props.card.metadata?.file_name ??
                        imgInformation()?.imgRangeStart ??
                        "Arguflow PDF From Range"
                      }/false`}
                      target="_blank"
                      title="Open PDF"
                    >
                      <FaRegularFilePdf class="h-5 w-5 fill-current" />
                    </a>
                  </Show>
                }
                tooltipText="View PDF"
              />
              <Tooltip
                body={
                  <Show when={imgInformation()}>
                    <a
                      class="h-fit"
                      href={`${apiHost}/pdf_from_range/${
                        imgInformation()?.imgRangeStart ?? 0
                      }/${imgInformation()?.imgRangeEnd ?? 0}/${
                        imgInformation()?.imgRangePrefix ?? ""
                      }/${
                        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                        props.card.metadata?.file_name ??
                        imgInformation()?.imgRangeStart ??
                        "Arguflow PDF From Range"
                      }/true`}
                      target="_blank"
                      title="Open PDF"
                    >
                      <RiOthersCharacterRecognitionLine class="h-5 w-5 fill-current" />
                    </a>
                  </Show>
                }
                tooltipText="View PDF With OCR"
              />
              <Tooltip
                body={
                  <Show when={Object.keys(props.card.metadata ?? {}).length}>
                    <button
                      class="h-fit"
                      onClick={() => setShowMetadata(true)}
                      title="View Images"
                    >
                      <FaRegularFileCode class="h-5 w-5 fill-current" />
                    </button>
                  </Show>
                }
                tooltipText="View Full Metadata"
              />
              <Tooltip
                body={
                  <>
                    <Show when={!copied()}>
                      <button class="h-fit" onClick={() => copyCard()}>
                        <AiOutlineCopy class="h-5 w-5 fill-current" />
                      </button>
                    </Show>
                    <Show when={copied()}>
                      <FiCheck class="text-green-500" />
                    </Show>
                  </>
                }
                tooltipText="Copy to clipboard"
              />
              <Show
                when={
                  props.setOnDelete &&
                  props.signedInUserId == props.card.author?.id
                }
              >
                <button
                  classList={{
                    "h-fit text-red-700 dark:text-red-400": true,
                    "animate-pulse": deleting(),
                  }}
                  title="Delete"
                  onClick={() => deleteCard()}
                >
                  <FiTrash class="h-5 w-5" />
                </button>
              </Show>
              <Show when={props.signedInUserId == props.card.author?.id}>
                <a title="Edit" href={`/card/edit/${props.card.id}`}>
                  <FiEdit class="h-5 w-5" />
                </a>
              </Show>
              <Tooltip
                body={
                  <a title="Open" href={`/card/${props.card.id}`}>
                    <VsFileSymlinkFile class="h-5 w-5 fill-current" />
                  </a>
                }
                tooltipText="Open in new tab"
              />
              <Show when={props.bookmarks}>
                {(bookmarks) => (
                  <CommunityBookmarkPopover
                    bookmarks={bookmarks().filter(
                      (bookmark) => bookmark.card_uuid === props.card.id,
                    )}
                  />
                )}
              </Show>
              <Show when={props.cardCollections}>
                {(cardCollections) => (
                  <BookmarkPopover
                    signedInUserId={props.signedInUserId}
                    totalCollectionPages={props.totalCollectionPages ?? 0}
                    cardCollections={cardCollections()}
                    cardMetadata={props.card}
                    setLoginModal={props.setShowModal}
                    bookmarks={
                      props.bookmarks?.filter(
                        (bookmark) => bookmark.card_uuid === props.card.id,
                      ) ?? []
                    }
                    setCardCollections={props.setCardCollections}
                  />
                )}
              </Show>
            </div>
            <div class="flex w-full flex-col">
              <For each={frontMatterVals}>
                {(frontMatterVal) => (
                  <>
                    <Show when={props.card.link && frontMatterVal == "link"}>
                      <a
                        class="line-clamp-1 w-fit break-all text-magenta-500 underline dark:text-turquoise-400"
                        target="_blank"
                        href={props.card.link ?? ""}
                      >
                        {props.card.link}
                      </a>
                    </Show>
                    <Show
                      when={props.card.tag_set && frontMatterVal == "tag_set"}
                    >
                      <div class="flex space-x-2">
                        <span class="font-semibold text-neutral-800 dark:text-neutral-200">
                          Tag Set:{" "}
                        </span>
                        <span class="line-clamp-1 break-all">
                          {props.card.tag_set}
                        </span>
                      </div>
                    </Show>
                    <Show
                      when={
                        props.card.time_stamp && frontMatterVal == "time_stamp"
                      }
                    >
                      <div class="flex space-x-2">
                        <span class="font-semibold text-neutral-800 dark:text-neutral-200">
                          Time Stamp:{" "}
                        </span>
                        <span class="line-clamp-1 break-all">
                          {formatDate(new Date(props.card.time_stamp ?? ""))}
                        </span>
                      </div>
                    </Show>
                    <Show
                      when={
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                        frontMatterVal !== "link" &&
                        frontMatterVal !== "tag_set" &&
                        frontMatterVal !== "time_stamp" &&
                        props.card.metadata &&
                        indirectHasOwnProperty(
                          props.card.metadata,
                          frontMatterVal,
                        ) &&
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
                        (props.card.metadata as any)[frontMatterVal]
                      }
                    >
                      <div class="flex space-x-2">
                        <span class="font-semibold text-neutral-800 dark:text-neutral-200">
                          {frontMatterVal}:{" "}
                        </span>
                        <span class="line-clamp-1 break-all">
                          {props.card.metadata &&
                            indirectHasOwnProperty(
                              props.card.metadata,
                              frontMatterVal,
                            ) &&
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call
                            (props.card.metadata as any)[
                              frontMatterVal
                            ].replace(/ +/g, " ")}
                        </span>
                      </div>
                    </Show>
                  </>
                )}
              </For>
              <div class="grid w-fit auto-cols-min grid-cols-[1fr,3fr] gap-x-2 text-neutral-800 dark:text-neutral-200">
                <Show when={props.score != 0}>
                  <span class="font-semibold">Similarity: </span>
                  <span>{props.score.toPrecision(3)}</span>
                </Show>
              </div>
            </div>
          </div>
          <div class="mb-1 h-1 w-full border-b border-neutral-300 dark:border-neutral-600" />
          <div
            classList={{
              "line-clamp-4 gradient-mask-b-0": useExpand() && !expanded(),
              "text-ellipsis max-w-[100%] break-words space-y-5 leading-normal !text-black dark:!text-white":
                true,
            }}
            style={
              useExpand() && !expanded()
                ? { "-webkit-line-clamp": linesBeforeShowMore }
                : {}
            }
            // eslint-disable-next-line solid/no-innerhtml
            innerHTML={sanitizeHtml(
              props.card.card_html !== undefined
                ? props.card.card_html
                    .replaceAll("line-height", "lh")
                    .replace("\n", " ")
                    .replace(`<br>`, " ")
                    .replace(`\\n`, " ")
                : "",
              sanitzerOptions,
            )}
          />
          <Show when={useExpand()}>
            <button
              classList={{
                "ml-2 font-semibold": true,
                "animate-pulse": !props.showExpand,
              }}
              disabled={!props.showExpand}
              onClick={() => setExpanded((prev) => !prev)}
            >
              {expanded() ? (
                <div class="flex flex-row items-center">
                  <div>Show Less</div>{" "}
                  <BiRegularChevronUp class="h-8 w-8 fill-current" />
                </div>
              ) : (
                <div class="flex flex-row items-center">
                  <div>Show More</div>{" "}
                  <BiRegularChevronDown class="h-8 w-8 fill-current" />
                </div>
              )}
            </button>
          </Show>
        </div>
      </Show>
      <Show when={showImageModal()}>
        <FullScreenModal isOpen={showImageModal} setIsOpen={setShowImageModal}>
          <div class="flex max-h-[75vh] max-w-[75vw] flex-col space-y-2 overflow-auto">
            <For
              each={Array.from({
                length:
                  (imgInformation()?.imgRangeEnd ?? 0) -
                  (imgInformation()?.imgRangeStart ?? 0) +
                  1,
              })}
            >
              {(_, i) => (
                <img
                  class="mx-auto my-auto"
                  src={`${apiHost}/image/${
                    imgInformation()?.imgRangePrefix ?? ""
                  }${(imgInformation()?.imgRangeStart ?? 0) + i()}.png`}
                />
              )}
            </For>
          </div>
        </FullScreenModal>
      </Show>
      <Show when={showMetadata()}>
        <FullScreenModal isOpen={showMetadata} setIsOpen={setShowMetadata}>
          <div class="flex max-h-[60vh] max-w-[75vw] flex-col space-y-2 overflow-auto scrollbar-thin scrollbar-track-neutral-200 scrollbar-thumb-neutral-400 scrollbar-thumb-rounded-md dark:scrollbar-track-neutral-800 dark:scrollbar-thumb-neutral-600">
            <For each={Object.keys(props.card.metadata ?? {})}>
              {(metadataKey) => (
                <div class="flex flex-wrap space-x-2">
                  <span>{`"${metadataKey}":`}</span>
                  <span>{`"${
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/restrict-template-expressions
                    typeof (props.card.metadata as any)[metadataKey] ===
                    "object"
                      ? JSON.stringify(
                          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
                          (props.card.metadata as any)[metadataKey],
                        )
                      : // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
                        (props.card.metadata as any)[metadataKey]
                  }"`}</span>
                </div>
              )}
            </For>
          </div>
        </FullScreenModal>
      </Show>
    </>
  );
};

export default ScoreCard;

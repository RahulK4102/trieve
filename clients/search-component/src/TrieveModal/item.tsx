import { Chunk, ChunkWithHighlights } from "../utils/types";
import React, { useCallback, useEffect, useRef } from "react";
import { ArrowIcon } from "./icons";
import { useModalState } from "../utils/hooks/modal-context";
import { sendCtrData } from "../utils/trieve";
import { useKeyboardNavigation } from "../utils/hooks/useKeyboardNavigation";
import { load } from "cheerio";

type Props = {
  item: ChunkWithHighlights;
  index: number;
};

export const Item = ({ item, index }: Props) => {
  const { onUpOrDownClicked } = useKeyboardNavigation();
  const { props } = useModalState();
  const Component = item.chunk.link ? "a" : "button";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const itemRef = useRef<HTMLButtonElement | HTMLLinkElement | any>(null);

  let descriptionHtml = item.highlights
    ? item.highlights.join("...")
    : item.chunk.chunk_html || "";
  const $descriptionHtml = load(descriptionHtml);
  $descriptionHtml("b").replaceWith(function () {
    return $descriptionHtml(this).text();
  });
  descriptionHtml = $descriptionHtml.html() || "";

  const chunkHtmlHeadings = load(item.chunk.chunk_html || "")
    .root()
    .find("h1, h2, h3, h4, h5, h6")
    .toArray();

  const $firstHeading = load(chunkHtmlHeadings[0]);
  const cleanFirstHeadingHtml = $firstHeading("*")
    .not("mark")
    .replaceWith(function () {
      return $firstHeading(this).text();
    });
  const cleanFirstHeading = cleanFirstHeadingHtml.html();

  descriptionHtml = descriptionHtml
    .replace(" </mark>", "</mark> ")
    .replace(cleanFirstHeading || "", "");

  for (const heading of chunkHtmlHeadings) {
    descriptionHtml = descriptionHtml.replace(load(heading).text() || "", "");
  }
  descriptionHtml = descriptionHtml.replace(/([.,!?;:])/g, "$1 ");

  const title =
    cleanFirstHeading ||
    item.chunk.metadata?.title ||
    item.chunk.metadata?.page_title ||
    item.chunk.metadata?.name;

  const checkForUpAndDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.code === "ArrowDown" || e.code === "ArrowUp") {
        onUpOrDownClicked(index, e.code);
      }
    },
    [item]
  );

  const onResultClick = async (chunk: Chunk & { position: number }) => {
    if (props.onResultClick) {
      props.onResultClick(chunk);
    }

    if (props.analytics) {
      await sendCtrData({
        trieve: props.trieve,
        index: chunk.position,
        chunkID: chunk.id,
      });
    }
    if (chunk.link) {
      location.href = chunk.link;
    }
  };

  useEffect(() => {
    itemRef.current?.addEventListener("keydown", checkForUpAndDown);
    return () => {
      itemRef.current?.removeEventListener("keydown", checkForUpAndDown);
    };
  }, []);

  return (
    <li>
      <Component
        ref={itemRef}
        id={`trieve-search-item-${index}`}
        className="item"
        onClick={() => onResultClick({ ...item.chunk, position: index })}
        {...(item.chunk.link ? { href: item.chunk.link } : {})}
      >
        <div>
          {props.showImages &&
          item.chunk.image_urls?.length &&
          item.chunk.image_urls[0] ? (
            <img src={item.chunk.image_urls[0]} />
          ) : null}
          {title ? (
            <div>
              <h4
                dangerouslySetInnerHTML={{
                  __html: title,
                }}
              />
              <p
                className="description"
                dangerouslySetInnerHTML={{
                  __html: descriptionHtml,
                }}
              />
            </div>
          ) : (
            <p
              dangerouslySetInnerHTML={{
                __html: descriptionHtml,
              }}
            />
          )}
          <ArrowIcon />
        </div>
      </Component>
    </li>
  );
};

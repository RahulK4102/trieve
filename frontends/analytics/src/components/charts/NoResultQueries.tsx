import { AnalyticsFilter, SearchQueryEvent } from "shared/types";
import { createQuery, useQueryClient } from "@tanstack/solid-query";
import {
  createEffect,
  createSignal,
  For,
  on,
  Show,
  useContext,
} from "solid-js";
import { DatasetContext } from "../../layouts/TopBarLayout";
import { usePagination } from "../../hooks/usePagination";
import { PaginationButtons } from "../PaginationButtons";
import { FullScreenModal } from "shared/ui";
import { SearchQueryEventModal } from "../../pages/TrendExplorer";
import { getNoResultQueries } from "../../api/analytics";

interface NoResultQueriesProps {
  params: {
    filter: AnalyticsFilter;
  };
}

export const NoResultQueries = (props: NoResultQueriesProps) => {
  const dataset = useContext(DatasetContext);
  const pages = usePagination();
  const queryClient = useQueryClient();

  createEffect(
    on(
      () => [props.params, dataset().dataset.id],
      () => {
        pages.resetMaxPageDiscovered();
      },
    ),
  );

  createEffect(() => {
    // Preload the next page
    const params = props.params;
    const datasetId = dataset().dataset.id;
    const curPage = pages.page();
    void queryClient.prefetchQuery({
      queryKey: [
        "no-result-queries",
        {
          params: params,
          page: curPage + 1,
        },
      ],
      queryFn: async () => {
        const results = await getNoResultQueries(
          params.filter,
          datasetId,
          curPage + 1,
        );
        if (results.length === 0) {
          pages.setMaxPageDiscovered(curPage);
        }
        return results;
      },
    });
  });

  const notResultQuery = createQuery(() => ({
    queryKey: [
      "no-result-queries",
      {
        params: props.params,
        page: pages.page(),
      },
    ],
    queryFn: () => {
      return getNoResultQueries(
        props.params.filter,
        dataset().dataset.id,
        pages.page(),
      );
    },
  }));

  return (
    <>
      <div>
        <div class="gap-2">
          <div class="text-lg">No Result Queries</div>
          <div class="text-sm text-neutral-600">Searches with no results</div>
        </div>
        <Show when={notResultQuery.data?.length === 0}>
          <div class="py-8 text-center opacity-80">No Data.</div>
        </Show>
        <Show
          fallback={<div class="py-8 text-center">Loading...</div>}
          when={notResultQuery.data}
        >
          {(data) => (
            <Show when={data().length > 0}>
              <table class="mt-2 w-full py-2">
                <thead>
                  <tr>
                    <th class="text-left font-semibold">Query</th>
                  </tr>
                </thead>
                <tbody>
                  <For each={data()}>
                    {(query) => {
                      return <QueryCard query={query} />;
                    }}
                  </For>
                </tbody>
              </table>
            </Show>
          )}
        </Show>
      </div>
      <div class="flex justify-end pt-2">
        <PaginationButtons size={18} pages={pages} />
      </div>
    </>
  );
};

interface QueryCardProps {
  query: SearchQueryEvent;
}
const QueryCard = (props: QueryCardProps) => {
  const [open, setOpen] = createSignal(false);
  return (
    <>
      <tr
        onClick={() => {
          setOpen(true);
        }}
        class="cursor-pointer"
      >
        <td class="truncate">{props.query.query}</td>
      </tr>
      <FullScreenModal title={props.query.query} show={open} setShow={setOpen}>
        <SearchQueryEventModal searchEvent={props.query} />
      </FullScreenModal>
    </>
  );
};

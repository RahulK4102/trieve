/* eslint-disable @typescript-eslint/no-unsafe-call */
import { BiRegularSearch, BiRegularX } from "solid-icons/bi";
import {
  For,
  Match,
  Show,
  Switch,
  createEffect,
  createMemo,
  createSignal,
  useContext,
} from "solid-js";
import {
  Menu,
  MenuItem,
  Popover,
  PopoverButton,
  PopoverPanel,
} from "solid-headless";
import { FaSolidCheck } from "solid-icons/fa";
import { DatasetAndUserContext } from "./Contexts/DatasetAndUserContext";
import { Filter, FilterItem, Filters } from "./FilterModal";
import { FiChevronDown, FiChevronUp } from "solid-icons/fi";
import {
  HighlightStrategy,
  isSortByField,
  isSortBySearchType,
  SearchOptions,
  SearchStore,
} from "../hooks/useSearch";
import { Tooltip } from "shared/ui";
import { BsQuestionCircle } from "solid-icons/bs";

const defaultFilter = {
  field: "",
};

const SearchForm = (props: { search: SearchStore; groupID?: string }) => {
  const bm25Active = import.meta.env.VITE_BM25_ACTIVE as unknown as string;

  const datasetAndUserContext = useContext(DatasetAndUserContext);
  const [tempSearchValues, setTempSearchValues] = createSignal(
    // eslint-disable-next-line solid/reactivity
    props.search.state,
  );
  const [tempFilterType, setTempFilterType] = createSignal<string>("must");
  const [mustFilters, setMustFilters] = createSignal<Filter[]>([]);
  const [mustNotFilters, setMustNotFilters] = createSignal<Filter[]>([]);
  const [shouldFilters, setShouldFilters] = createSignal<Filter[]>([]);
  const [jsonbPrefilter, setJsonbPrefilter] = createSignal<boolean>(true);
  const [rerankQuery, setRerankQuery] = createSignal<string>("");
  const curDatasetFiltersKey = createMemo(
    () =>
      `filters-${datasetAndUserContext.currentDataset?.()?.dataset.id ?? ""}`,
  );

  const saveFilters = (setShowFilterModal: (filter: boolean) => void) => {
    const filters = {
      must: mustFilters(),
      must_not: mustNotFilters(),
      should: shouldFilters(),
      jsonb_prefilter: jsonbPrefilter(),
    };
    localStorage.setItem(curDatasetFiltersKey(), JSON.stringify(filters));
    window.dispatchEvent(new Event("filtersUpdated"));
    setShowFilterModal(false);
  };

  createEffect((prevFiltersKey) => {
    const filtersKey = curDatasetFiltersKey();
    if (prevFiltersKey === filtersKey) {
      return filtersKey;
    }

    const savedFilters = localStorage.getItem(filtersKey);
    if (savedFilters) {
      const parsedFilters = JSON.parse(savedFilters) as Filters;
      setMustFilters(parsedFilters.must);
      setMustNotFilters(parsedFilters.must_not);
      setShouldFilters(parsedFilters.should);
      setJsonbPrefilter(parsedFilters.jsonb_prefilter ?? true);
    }
  }, "");

  const default_settings = [
    { name: "Hybrid", isSelected: false, route: "hybrid" },
    {
      name: "FullText",
      isSelected: false,
      route: "fulltext",
    },
    {
      name: "Semantic",
      isSelected: false,
      route: "semantic",
    },
    {
      name: "AutoComplete Semantic",
      isSelected: false,
      route: "autocomplete-semantic",
    },
    {
      name: "AutoComplete FullText",
      isSelected: false,
      route: "autocomplete-fulltext",
    },
  ];

  if (bm25Active) {
    default_settings.push({ name: "BM25", isSelected: false, route: "BM25" });
  }

  const [searchTypes, setSearchTypes] = createSignal(default_settings);
  const [sortTypes, setSortTypes] = createSignal([
    {
      name: "Timestamp",
      isSelected: false,
      value: "time_stamp",
    },
    {
      name: "Num Value",
      isSelected: false,
      value: "num_value",
    },
  ]);

  const [rerankTypes, setRerankTypes] = createSignal([
    {
      name: "Semantic",
      isSelected: false,
      value: "semantic",
    },
    {
      name: "FullText",
      isSelected: false,
      value: "fulltext",
    },
    {
      name: "Cross Encoder",
      isSelected: false,
      value: "cross_encoder",
    },
  ]);

  createEffect(() => {
    setSearchTypes((prev) => {
      return prev.map((type) => {
        if (type.route === props.search.state.searchType) {
          return { ...type, isSelected: true };
        } else {
          return { ...type, isSelected: false };
        }
      });
    });
  });

  createEffect(() => {
    setSortTypes((prev) => {
      return prev.map((type) => {
        if (isSortByField(props.search.state.sort_by)) {
          if (type.value === props.search.state.sort_by.field) {
            return { ...type, isSelected: true };
          } else {
            return { ...type, isSelected: false };
          }
        } else {
          return { ...type, isSelected: false };
        }
      });
    });
  });

  createEffect(() => {
    setRerankTypes((prev) => {
      return prev.map((type) => {
        if (isSortBySearchType(props.search.state.sort_by)) {
          if (type.value === props.search.state.sort_by.rerank_type) {
            return { ...type, isSelected: true };
          } else {
            return { ...type, isSelected: false };
          }
        } else {
          return { ...type, isSelected: false };
        }
      });
    });
  });

  createEffect(() => {
    props.search.setSearch(
      "searchType",
      searchTypes().find((type) => type.isSelected)?.route ?? "hybrid",
    );
  });

  createEffect(() => {
    props.search.setSearch("sort_by", {
      field: sortTypes().find((type) => type.isSelected)?.value,
    });
  });

  createEffect(() => {
    props.search.setSearch("sort_by", {
      rerank_type: rerankTypes().find((type) => type.isSelected)?.value,
      rerank_query: rerankQuery() == "" ? undefined : rerankQuery(),
    });
  });

  const filtersLength = createMemo(() => {
    return (
      mustFilters().length + mustNotFilters().length + shouldFilters().length
    );
  });

  return (
    <>
      <div class="w-full">
        <form class="w-full space-y-4 dark:text-white">
          <div class="relative flex">
            <div
              classList={{
                "flex w-full justify-center space-x-2 rounded-md bg-neutral-100 px-4 py-1 pr-[10px] dark:bg-neutral-700":
                  true,
              }}
            >
              <BiRegularSearch class="mt-1 h-6 w-6 fill-current" />
              <textarea
                id="search-query-textarea"
                classList={{
                  "scrollbar-track-rounded-md scrollbar-thumb-rounded-md mr-2 h-fit max-h-[240px] w-full resize-none whitespace-pre-wrap bg-transparent py-1 scrollbar-thin scrollbar-track-neutral-200 scrollbar-thumb-neutral-400 focus:outline-none dark:bg-neutral-700 dark:text-white dark:scrollbar-track-neutral-700 dark:scrollbar-thumb-neutral-600":
                    true,
                }}
                value={props.search.state.query}
                onInput={(e) => {
                  props.search.setSearch("query", e.currentTarget.value);
                }}
                onKeyDown={(e) => {
                  if (
                    ((e.ctrlKey || e.metaKey) && e.key === "Enter") ||
                    (!e.shiftKey && e.key === "Enter")
                  ) {
                    props.search.setSearch("version", (prev) => prev + 1);
                    e.preventDefault();
                    e.stopPropagation();
                  }
                }}
                placeholder="Search for chunks..."
                rows={props.search.state.query.split("\n").length}
              />
              <button
                classList={{
                  "pt-[2px]": !!props.search.state.query,
                }}
                onClick={(e) => {
                  e.preventDefault();
                  props.search.setSearch("query", "");
                }}
              >
                <BiRegularX class="h-7 w-7 fill-current" />
              </button>
              <button
                classList={{
                  "border-l border-neutral-600 pl-[10px] dark:border-neutral-200":
                    !!props.search.state.query,
                }}
                type="submit"
              >
                <BiRegularSearch class="mt-1 h-6 w-6 fill-current" />
              </button>
            </div>
          </div>
          <div class="flex flex-wrap space-x-3">
            <Popover
              defaultOpen={false}
              class="relative"
              onOpen={() => {
                const filtersKey = curDatasetFiltersKey();
                const savedFilters = localStorage.getItem(filtersKey);
                if (savedFilters) {
                  const parsedFilters = JSON.parse(savedFilters) as Filters;
                  setMustFilters(parsedFilters.must);
                  setMustNotFilters(parsedFilters.must_not);
                  setShouldFilters(parsedFilters.should);
                  setJsonbPrefilter(parsedFilters.jsonb_prefilter ?? true);
                }
              }}
              onClose={() => {
                saveFilters(() => {});
              }}
            >
              {({ isOpen, setState }) => (
                <>
                  <PopoverButton
                    aria-label="Toggle filters"
                    type="button"
                    class="flex items-center space-x-1 pb-1 text-sm"
                  >
                    <Tooltip
                      direction="right"
                      body={
                        <div
                          classList={{
                            "rounded-full w-3 h-3 text-[8px] text-center leading-[10px]":
                              true,
                            "bg-fuchsia-500 text-white": filtersLength() > 0,
                            "bg-neutral-100 text-neutral-500":
                              filtersLength() === 0,
                          }}
                        >
                          {filtersLength()}
                        </div>
                      }
                      tooltipText={`${filtersLength()} filter(s) applied`}
                    />
                    <span>Filters</span>
                    <Switch>
                      <Match when={isOpen()}>
                        <FiChevronUp class="h-3.5 w-3.5" />
                      </Match>
                      <Match when={!isOpen()}>
                        <FiChevronDown class="h-3.5 w-3.5" />
                      </Match>
                    </Switch>
                  </PopoverButton>
                  <Show when={isOpen()}>
                    <PopoverPanel
                      tabIndex={0}
                      unmount={false}
                      class="absolute z-10 mt-2 h-fit w-fit rounded-md bg-neutral-200 p-1 shadow-lg dark:bg-neutral-700"
                    >
                      <div class="flex max-h-[50vh] min-w-[70vw] max-w-[75vw] flex-col space-y-2 overflow-auto px-2 pr-2 scrollbar-thin scrollbar-track-neutral-200 scrollbar-thumb-neutral-400 scrollbar-thumb-rounded-md dark:text-white dark:scrollbar-track-neutral-800 dark:scrollbar-thumb-neutral-600 xl:min-w-[50vw] 2xl:min-w-[40vw]">
                        <div class="flex w-full items-center space-x-2 border-b border-neutral-400 py-2 dark:border-neutral-900">
                          <label aria-label="Change Filter Type">
                            <span class="p-1">Filter Type:</span>
                          </label>
                          <select
                            class="h-fit rounded-md border border-neutral-400 bg-neutral-100 p-1 dark:border-neutral-900 dark:bg-neutral-800"
                            onChange={(e) => {
                              setTempFilterType(e.currentTarget.value);
                            }}
                            value={tempFilterType()}
                          >
                            <For each={["must", "must not", "should"]}>
                              {(filter_type) => {
                                return (
                                  <option
                                    classList={{
                                      "flex w-full items-center justify-between rounded p-1":
                                        true,
                                      "bg-neutral-300 dark:bg-neutral-900":
                                        filter_type === tempFilterType(),
                                    }}
                                  >
                                    {filter_type}
                                  </option>
                                );
                              }}
                            </For>
                          </select>
                          <button
                            type="button"
                            class="rounded-md border border-neutral-400 bg-neutral-100 p-1 dark:border-neutral-900 dark:bg-neutral-800"
                            onClick={() => {
                              const curFilterType = tempFilterType();
                              if (curFilterType === "must") {
                                setMustFilters([
                                  ...mustFilters(),
                                  defaultFilter,
                                ]);
                              }
                              if (curFilterType === "must not") {
                                setMustNotFilters([
                                  ...mustNotFilters(),
                                  defaultFilter,
                                ]);
                              }
                              if (curFilterType === "should") {
                                setShouldFilters([
                                  ...shouldFilters(),
                                  defaultFilter,
                                ]);
                              }
                            }}
                          >
                            + Add Filter
                          </button>
                          <div class="flex-1" />
                          <label
                            aria-label="Change JSONB Prefilter"
                            class="flex items-center gap-x-1"
                          >
                            <Tooltip
                              body={
                                <BsQuestionCircle class="h-4 w-4 rounded-full fill-current" />
                              }
                              tooltipText="Only uncheck if on the enterprise plan and you wish to use custom indices for metadata filters."
                            />
                            <span>JSONB Prefilter:</span>
                          </label>
                          <input
                            type="checkbox"
                            class="rounded-md border border-neutral-400 bg-neutral-100 dark:border-neutral-900 dark:bg-neutral-800"
                            onChange={(e) => {
                              setJsonbPrefilter(e.currentTarget.checked);
                            }}
                            checked={jsonbPrefilter()}
                          />
                          <button
                            type="button"
                            class="rounded-md border border-neutral-400 bg-neutral-100 p-1 dark:border-neutral-900 dark:bg-neutral-800"
                            onClick={() => {
                              setMustFilters([]);
                              setMustNotFilters([]);
                              setShouldFilters([]);
                            }}
                          >
                            Reset Filters
                          </button>
                          <button
                            type="button"
                            class="rounded-md border border-neutral-400 bg-neutral-100 p-1 dark:border-neutral-900 dark:bg-neutral-800"
                            onClick={() => saveFilters(setState)}
                          >
                            Apply Filters
                          </button>
                        </div>
                        <Show when={mustFilters().length > 0}>
                          <div class="border-b border-neutral-400 py-2 dark:border-neutral-900">
                            must: [
                            <div class="flex flex-col gap-y-2">
                              <For each={mustFilters()}>
                                {(filter, index) => {
                                  const onFilterChange = (
                                    newFilter: Filter,
                                  ) => {
                                    const newFilters = mustFilters();
                                    newFilters[index()] = newFilter;
                                    setMustFilters(newFilters);
                                  };

                                  return (
                                    <div
                                      classList={{
                                        "border-b border-dotted border-neutral-400 dark:border-neutral-900":
                                          index() < mustFilters().length - 1,
                                      }}
                                    >
                                      <FilterItem
                                        initialFilter={filter}
                                        onFilterChange={onFilterChange}
                                      />
                                    </div>
                                  );
                                }}
                              </For>
                            </div>
                            ]
                          </div>
                        </Show>
                        <Show when={mustNotFilters().length > 0}>
                          <div class="border-b border-neutral-400 py-2 dark:border-neutral-900">
                            must not: [
                            <div class="flex flex-col gap-y-2">
                              <For each={mustNotFilters()}>
                                {(filter, index) => {
                                  const onFilterChange = (
                                    newFilter: Filter,
                                  ) => {
                                    const newFilters = mustNotFilters();
                                    newFilters[index()] = newFilter;
                                    setMustNotFilters(newFilters);
                                  };

                                  return (
                                    <div
                                      classList={{
                                        "border-b border-dotted border-neutral-400 dark:border-neutral-900":
                                          index() < mustNotFilters().length - 1,
                                      }}
                                    >
                                      <FilterItem
                                        initialFilter={filter}
                                        onFilterChange={onFilterChange}
                                      />
                                    </div>
                                  );
                                }}
                              </For>
                            </div>
                            ]
                          </div>
                        </Show>
                        <Show when={shouldFilters().length > 0}>
                          <div class="border-b border-neutral-400 py-2 dark:border-neutral-900">
                            should: [
                            <div class="flex flex-col gap-y-2">
                              <For each={shouldFilters()}>
                                {(filter, index) => {
                                  const onFilterChange = (
                                    newFilter: Filter,
                                  ) => {
                                    const newFilters = shouldFilters();
                                    newFilters[index()] = newFilter;
                                    setShouldFilters(newFilters);
                                  };

                                  return (
                                    <div
                                      classList={{
                                        "border-b border-dotted border-neutral-400 dark:border-neutral-900":
                                          index() < shouldFilters().length - 1,
                                      }}
                                    >
                                      <FilterItem
                                        initialFilter={filter}
                                        onFilterChange={onFilterChange}
                                      />
                                    </div>
                                  );
                                }}
                              </For>
                            </div>
                            ]
                          </div>
                        </Show>
                      </div>
                    </PopoverPanel>
                  </Show>
                </>
              )}
            </Popover>
            <Popover defaultOpen={false} class="relative">
              {({ isOpen, setState }) => (
                <>
                  <PopoverButton
                    aria-label="Toggle filters"
                    type="button"
                    class="flex items-center space-x-1 pb-1 text-sm"
                  >
                    <span>
                      Type:{" "}
                      {searchTypes().find((type) => type.isSelected)?.name ??
                        "Hybrid"}
                    </span>
                    <Switch>
                      <Match when={isOpen()}>
                        <FiChevronUp class="h-3.5 w-3.5" />
                      </Match>
                      <Match when={!isOpen()}>
                        <FiChevronDown class="h-3.5 w-3.5" />
                      </Match>
                    </Switch>
                  </PopoverButton>
                  <Show when={isOpen()}>
                    <PopoverPanel
                      unmount={false}
                      class="absolute z-10 mt-2 h-fit w-[180px] rounded-md bg-neutral-200 p-1 shadow-lg dark:bg-neutral-800"
                    >
                      <Menu class="ml-1 space-y-1">
                        <For each={searchTypes()}>
                          {(option) => {
                            if (props.groupID && option.route === "hybrid") {
                              return <></>;
                            }

                            const onClick = (e: Event) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSearchTypes((prev) => {
                                return prev.map((item) => {
                                  if (item.name === option.name) {
                                    return { ...item, isSelected: true };
                                  } else {
                                    return { ...item, isSelected: false };
                                  }
                                });
                              });
                              setState(true);
                            };
                            return (
                              <MenuItem
                                as="button"
                                classList={{
                                  "flex w-full items-center justify-between rounded p-1 focus:text-black focus:outline-none dark:hover:text-white dark:focus:text-white":
                                    true,
                                  "bg-neutral-300 dark:bg-neutral-900":
                                    option.isSelected ||
                                    (option.route == "hybrid" &&
                                      searchTypes().find(
                                        (type) => type.isSelected,
                                      )?.name == undefined),
                                }}
                                onClick={onClick}
                              >
                                <div class="flex flex-row justify-start space-x-2">
                                  <span class="text-left">{option.name}</span>
                                </div>
                                {(option.isSelected ||
                                  (option.route == "hybrid" &&
                                    searchTypes().find(
                                      (type) => type.isSelected,
                                    )?.name == undefined)) && (
                                  <span>
                                    <FaSolidCheck class="fill-current text-xl" />
                                  </span>
                                )}
                              </MenuItem>
                            );
                          }}
                        </For>
                      </Menu>
                    </PopoverPanel>
                  </Show>
                </>
              )}
            </Popover>
            <Popover defaultOpen={false} class="relative">
              {({ isOpen, setState }) => (
                <>
                  <PopoverButton
                    aria-label="Toggle filters"
                    type="button"
                    class="flex items-center space-x-1 pb-1 text-sm"
                  >
                    <span>Sort</span>
                    <Switch>
                      <Match when={isOpen()}>
                        <FiChevronUp class="h-3.5 w-3.5" />
                      </Match>
                      <Match when={!isOpen()}>
                        <FiChevronDown class="h-3.5 w-3.5" />
                      </Match>
                    </Switch>
                  </PopoverButton>
                  <Show when={isOpen()}>
                    <PopoverPanel
                      unmount={false}
                      class="absolute z-10 mt-2 h-fit w-[180px] rounded-md bg-neutral-200 p-1 shadow-lg dark:bg-neutral-800"
                    >
                      <Menu class="ml-1 space-y-1">
                        <For each={sortTypes()}>
                          {(option) => {
                            const onClick = (e: Event) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSortTypes((prev) => {
                                return prev.map((item) => {
                                  if (item.name === option.name) {
                                    return {
                                      ...item,
                                      isSelected: !item.isSelected,
                                    };
                                  } else {
                                    return {
                                      ...item,
                                      isSelected: item.isSelected,
                                    };
                                  }
                                });
                              });
                              setState(true);
                            };
                            return (
                              <MenuItem
                                as="button"
                                classList={{
                                  "flex w-full items-center justify-between rounded p-1 focus:text-black focus:outline-none dark:hover:text-white dark:focus:text-white":
                                    true,
                                  "bg-neutral-300 dark:bg-neutral-900":
                                    option.isSelected,
                                }}
                                onClick={onClick}
                              >
                                <div class="flex flex-row justify-start space-x-2">
                                  <span class="text-left">{option.name}</span>
                                </div>
                                {option.isSelected && (
                                  <span>
                                    <FaSolidCheck class="fill-current text-xl" />
                                  </span>
                                )}
                              </MenuItem>
                            );
                          }}
                        </For>
                      </Menu>
                    </PopoverPanel>
                  </Show>
                </>
              )}
            </Popover>
            <Popover defaultOpen={false} class="relative">
              {({ isOpen, setState }) => (
                <>
                  <PopoverButton
                    aria-label="Toggle filters"
                    type="button"
                    class="flex items-center space-x-1 pb-1 text-sm"
                  >
                    <span>Rerank By</span>
                    <Switch>
                      <Match when={isOpen()}>
                        <FiChevronUp class="h-3.5 w-3.5" />
                      </Match>
                      <Match when={!isOpen()}>
                        <FiChevronDown class="h-3.5 w-3.5" />
                      </Match>
                    </Switch>
                  </PopoverButton>
                  <Show when={isOpen()}>
                    <PopoverPanel
                      unmount={false}
                      class="absolute z-10 mt-2 h-fit w-[180px] rounded-md bg-neutral-200 p-1 shadow-lg dark:bg-neutral-800"
                    >
                      <Menu class="ml-1 space-y-1">
                        <input
                          type="text"
                          class="max-w-[165px] rounded-md border border-neutral-400 bg-neutral-100 p-1 dark:border-neutral-900 dark:bg-neutral-800"
                          placeholder="Rerank Query"
                          onChange={(e) => {
                            setRerankQuery(e.currentTarget.value);
                          }}
                          value={rerankQuery()}
                        />
                        <For each={rerankTypes()}>
                          {(option) => {
                            const onClick = (e: Event) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setRerankTypes((prev) => {
                                return prev.map((item) => {
                                  if (item.name === option.name) {
                                    return {
                                      ...item,
                                      isSelected: !item.isSelected,
                                    };
                                  } else {
                                    return {
                                      ...item,
                                      isSelected: false,
                                    };
                                  }
                                });
                              });
                              setState(true);
                            };
                            return (
                              <MenuItem
                                as="button"
                                classList={{
                                  "flex w-full items-center justify-between rounded p-1 focus:text-black focus:outline-none dark:hover:text-white dark:focus:text-white":
                                    true,
                                  "bg-neutral-300 dark:bg-neutral-900":
                                    option.isSelected,
                                }}
                                onClick={onClick}
                              >
                                <div class="flex flex-row justify-start space-x-2">
                                  <span class="text-left">{option.name}</span>
                                </div>
                                {option.isSelected && (
                                  <span>
                                    <FaSolidCheck class="fill-current text-xl" />
                                  </span>
                                )}
                              </MenuItem>
                            );
                          }}
                        </For>
                      </Menu>
                    </PopoverPanel>
                  </Show>
                </>
              )}
            </Popover>
            <Popover
              defaultOpen={false}
              class="relative"
              onClose={() => {
                const newSearchValues = tempSearchValues();
                newSearchValues.version = props.search.state.version + 1;

                newSearchValues.sort_by = props.search.state.sort_by;
                newSearchValues.searchType = props.search.state.searchType;
                newSearchValues.groupUniqueSearch =
                  props.search.state.groupUniqueSearch;
                newSearchValues.query = props.search.state.query;

                props.search.setSearch(newSearchValues);

                const searchTextarea = document.getElementById(
                  "search-query-textarea",
                );
                searchTextarea?.focus();
                setTimeout(() => {
                  searchTextarea?.focus();
                }, 50);
                setTimeout(() => {
                  searchTextarea?.focus();
                }, 100);
                setTimeout(() => {
                  searchTextarea?.focus();
                }, 200);
                setTimeout(() => {
                  searchTextarea?.focus();
                }, 300);
                setTimeout(() => {
                  searchTextarea?.focus();
                }, 400);
                setTimeout(() => {
                  searchTextarea?.focus();
                }, 500);
              }}
            >
              {({ isOpen }) => (
                <>
                  <PopoverButton
                    aria-label="Toggle options"
                    type="button"
                    class="flex items-center space-x-1 pb-1 text-sm"
                  >
                    <span>Options</span>
                    <Switch>
                      <Match when={isOpen()}>
                        <FiChevronUp class="h-3.5 w-3.5" />
                      </Match>
                      <Match when={!isOpen()}>
                        <FiChevronDown class="h-3.5 w-3.5" />
                      </Match>
                    </Switch>
                  </PopoverButton>
                  <Show when={isOpen()}>
                    <PopoverPanel
                      unmount={false}
                      tabIndex={0}
                      class="absolute z-10 mt-2 h-fit w-[80vw] rounded-md bg-neutral-200 p-1 shadow-lg dark:bg-neutral-700 sm:w-[300px] md:w-[400px]"
                    >
                      <div class="items flex flex-col space-y-1">
                        <div class="mt-1">
                          <button
                            class="rounded-md border border-neutral-400 bg-neutral-100 px-2 py-1 dark:border-neutral-900 dark:bg-neutral-800"
                            onClick={(e) => {
                              e.preventDefault();
                              setTempSearchValues((prev) => {
                                return {
                                  ...props.search.state,
                                  ...prev,
                                  scoreThreshold: 0.0,
                                  extendResults: false,
                                  slimChunks: false,
                                  sort_by: {
                                    field: "",
                                  },
                                  pageSize: 10,
                                  getTotalPages: false,
                                  highlightStrategy: "exactmatch",
                                  highlightResults: true,
                                  highlightDelimiters: ["?", ".", "!"],
                                  highlightMaxLength: 8,
                                  highlightMaxNum: 3,
                                  highlightWindow: 0,
                                  group_size: 3,
                                  removeStopWords: false,
                                } as SearchOptions;
                              });
                            }}
                          >
                            Reset
                          </button>
                        </div>
                        <div class="flex items-center justify-between space-x-2 p-1">
                          <label>Score Threshold (0.0 to 1.0):</label>
                          <input
                            class="w-16 rounded border border-neutral-400 p-0.5 text-black"
                            type="number"
                            step="any"
                            value={tempSearchValues().scoreThreshold}
                            onChange={(e) => {
                              setTempSearchValues((prev) => {
                                return {
                                  ...prev,
                                  scoreThreshold: parseFloat(
                                    e.currentTarget.value,
                                  ),
                                };
                              });
                            }}
                          />
                        </div>
                        <div class="flex items-center justify-between space-x-2 p-1">
                          <label>Highlight exact match</label>
                          <select
                            class="h-fit rounded-md border border-neutral-400 bg-neutral-100 p-1 dark:border-neutral-900 dark:bg-neutral-800"
                            onChange={(s) => {
                              setTempSearchValues((prev) => {
                                return {
                                  ...prev,
                                  highlightStrategy: s.target
                                    .value as HighlightStrategy,
                                };
                              });
                            }}
                            value={tempSearchValues().highlightStrategy}
                          >
                            <option value="v1">V1</option>
                            <option value="exactmatch">Exact match</option>
                          </select>
                        </div>
                        <Show
                          when={
                            searchTypes().find((type) => type.isSelected)
                              ?.route === "autocomplete-semantic" ||
                            searchTypes().find((type) => type.isSelected)
                              ?.route === "autocomplete-fulltext"
                          }
                        >
                          <div class="flex items-center justify-between space-x-2 p-1">
                            <label>Extend Results (autocomplete only):</label>
                            <input
                              class="h-4 w-4"
                              type="checkbox"
                              checked={tempSearchValues().extendResults}
                              onChange={(e) => {
                                setTempSearchValues((prev) => {
                                  return {
                                    ...prev,
                                    extendResults: e.target.checked,
                                  };
                                });
                              }}
                            />
                          </div>
                        </Show>
                        <div class="flex items-center justify-between space-x-2 p-1">
                          <label>Slim Chunks (Latency Improvement):</label>
                          <input
                            class="h-4 w-4"
                            type="checkbox"
                            checked={tempSearchValues().slimChunks}
                            onChange={(e) => {
                              setTempSearchValues((prev) => {
                                return {
                                  ...prev,
                                  slimChunks: e.target.checked,
                                };
                              });
                            }}
                          />
                        </div>
                        <div class="flex items-center justify-between space-x-2 p-1">
                          <label>Page Size:</label>
                          <input
                            class="w-16 rounded border border-neutral-400 p-0.5 text-black"
                            type="number"
                            value={tempSearchValues().pageSize}
                            onChange={(e) => {
                              setTempSearchValues((prev) => {
                                return {
                                  ...prev,
                                  pageSize: parseInt(e.currentTarget.value),
                                };
                              });
                            }}
                          />
                        </div>
                        <div class="flex items-center justify-between space-x-2 p-1">
                          <label>Use Quote Negated Words</label>
                          <input
                            class="h-4 w-4"
                            type="checkbox"
                            checked={tempSearchValues().useQuoteNegatedTerms}
                            onChange={(e) => {
                              setTempSearchValues((prev) => {
                                return {
                                  ...prev,
                                  useQuoteNegatedTerms: e.target.checked,
                                };
                              });
                            }}
                          />
                        </div>
                        <div class="flex items-center justify-between space-x-2 p-1">
                          <label>Get Total Pages (Latency Penalty):</label>
                          <input
                            class="h-4 w-4"
                            type="checkbox"
                            checked={tempSearchValues().getTotalPages}
                            onChange={(e) => {
                              setTempSearchValues((prev) => {
                                return {
                                  ...prev,
                                  getTotalPages: e.target.checked,
                                };
                              });
                            }}
                          />
                        </div>
                        <div class="flex items-center justify-between space-x-2 p-1">
                          <label>Remove Stop Words</label>
                          <input
                            class="h-4 w-4"
                            type="checkbox"
                            checked={tempSearchValues().removeStopWords}
                            onChange={(e) => {
                              setTempSearchValues((prev) => {
                                return {
                                  ...prev,
                                  removeStopWords: e.target.checked,
                                };
                              });
                            }}
                          />
                        </div>
                        <div class="flex items-center justify-between space-x-2 p-1">
                          <label>Highlight Results (Latency Penalty):</label>
                          <input
                            class="h-4 w-4"
                            type="checkbox"
                            checked={tempSearchValues().highlightResults}
                            onChange={(e) => {
                              setTempSearchValues((prev) => {
                                return {
                                  ...prev,
                                  highlightResults: e.target.checked,
                                };
                              });
                            }}
                          />
                        </div>
                        <div class="items flex justify-between space-x-2 p-1">
                          <label>Highlight Threshold:</label>
                          <input
                            class="w-16 rounded border border-neutral-400 p-0.5 text-black"
                            type="number"
                            step="any"
                            value={tempSearchValues().highlightThreshold}
                            onChange={(e) => {
                              setTempSearchValues((prev) => {
                                return {
                                  ...prev,
                                  highlightThreshold: parseFloat(
                                    e.currentTarget.value,
                                  ),
                                };
                              });
                            }}
                          />
                        </div>
                        <div class="items flex justify-between space-x-2 p-1">
                          <label>Highlight Delimiters (Comma Separated):</label>
                          <input
                            class="w-16 rounded border border-neutral-400 p-0.5 text-black"
                            type="text"
                            value={tempSearchValues().highlightDelimiters.join(
                              ",",
                            )}
                            onInput={(e) => {
                              if (e.currentTarget.value === " ") {
                                setTempSearchValues((prev) => {
                                  return {
                                    ...prev,
                                    highlightDelimiters: [" "],
                                  };
                                });
                              }

                              setTempSearchValues((prev) => {
                                return {
                                  ...prev,
                                  highlightDelimiters:
                                    e.currentTarget.value.split(","),
                                };
                              });
                            }}
                          />
                        </div>
                        <div class="items flex justify-between space-x-2 p-1">
                          <label>Highlight Max Length:</label>
                          <input
                            class="w-16 rounded border border-neutral-400 p-0.5 text-black"
                            type="number"
                            value={tempSearchValues().highlightMaxLength}
                            onChange={(e) => {
                              setTempSearchValues((prev) => {
                                return {
                                  ...prev,
                                  highlightMaxLength: parseInt(
                                    e.currentTarget.value,
                                  ),
                                };
                              });
                            }}
                          />
                        </div>
                        <div class="items flex justify-between space-x-2 p-1">
                          <label>Highlight Max Num:</label>
                          <input
                            class="w-16 rounded border border-neutral-400 p-0.5 text-black"
                            type="number"
                            value={tempSearchValues().highlightMaxNum}
                            onChange={(e) => {
                              setTempSearchValues((prev) => {
                                return {
                                  ...prev,
                                  highlightMaxNum: parseInt(
                                    e.currentTarget.value,
                                  ),
                                };
                              });
                            }}
                          />
                        </div>
                        <div class="items flex justify-between space-x-2 p-1">
                          <label>Highlight Window:</label>
                          <input
                            class="w-16 rounded border border-neutral-400 p-0.5 text-black"
                            type="number"
                            value={tempSearchValues().highlightWindow}
                            onChange={(e) => {
                              setTempSearchValues((prev) => {
                                return {
                                  ...prev,
                                  highlightWindow: parseInt(
                                    e.currentTarget.value,
                                  ),
                                };
                              });
                            }}
                          />
                        </div>
                        <Show when={props.search.state.groupUniqueSearch}>
                          <div class="items flex justify-between space-x-2 p-1">
                            <label>Group size:</label>
                            <input
                              class="w-16 rounded border border-neutral-400 p-0.5 text-black"
                              type="number"
                              value={tempSearchValues().group_size}
                              onChange={(e) => {
                                setTempSearchValues((prev) => {
                                  return {
                                    ...prev,
                                    group_size: parseInt(e.currentTarget.value),
                                  };
                                });
                              }}
                            />
                          </div>
                        </Show>
                      </div>
                    </PopoverPanel>
                  </Show>
                </>
              )}
            </Popover>
            <Show when={!props.groupID}>
              <div class="flex-1" />
              <div class="flex items-center space-x-2 justify-self-center">
                <label class="text-sm">Group Search</label>
                <input
                  class="h-4 w-4"
                  type="checkbox"
                  checked={props.search.state.groupUniqueSearch}
                  onChange={(e) => {
                    props.search.setSearch(
                      "groupUniqueSearch",
                      e.target.checked,
                    );
                  }}
                />
              </div>
            </Show>
          </div>
        </form>
      </div>
    </>
  );
};

export default SearchForm;

// src/components/SidebarSortBar.tsx
import { For } from "solid-js";
import type { SortMode } from "../utils/sort";

const SORT_OPTIONS: { mode: SortMode; label: string }[] = [
  { mode: "name", label: "名称" },
  { mode: "date", label: "时间" },
  { mode: "random", label: "随机" },
];

interface SidebarSortBarProps {
  sortMode: SortMode;
  setSortMode: (mode: SortMode) => void;
}

export const SidebarSortBar = (props: SidebarSortBarProps) => {
  return (
    <div class="sort-bar">
      <span class="sort-label">排序</span>
      <For each={SORT_OPTIONS}>
        {(opt) => (
          <button
            classList={{
              "sort-btn": true,
              active: props.sortMode === opt.mode,
            }}
            onClick={() => props.setSortMode(opt.mode)}
          >
            {opt.label}
          </button>
        )}
      </For>
    </div>
  );
};
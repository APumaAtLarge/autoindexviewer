// src/components/sidebar/SidebarSortBar.tsx
import { For } from "solid-js";
import { sortMode, setSortMode, isPinned, setIsPinned } from "../../store/sidebarUI";
import type { SortMode } from "../../utils/sort";
import "./SidebarSortBar.scss";

const SORT_OPTIONS: { mode: SortMode; label: string }[] = [
  { mode: "name", label: "名称" },
  { mode: "date", label: "时间" },
  { mode: "random", label: "随机" },
];

export const SidebarSortBar = () => {
  return (
    <div class="sort-bar">
      <span class="sort-label">排序</span>
      <For each={SORT_OPTIONS}>
        {(opt) => (
          <button
            classList={{
              "sort-btn": true,
              active: sortMode() === opt.mode,
            }}
            onClick={() => setSortMode(opt.mode)}
          >
            {opt.label}
          </button>
        )}
      </For>

      <div style={{ flex: 1 }} />
      
      <button
        classList={{
          "sort-btn": true,
          active: isPinned(),
        }}
        title="固定当前 Tab（点击文件夹时不自动跳转到当前目录）"
        onClick={() => setIsPinned(!isPinned())}
      >
        📌
      </button>
    </div>
  );
};
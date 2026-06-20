
// src/store/sidebarUI.ts
import { createSignal, createRoot, createEffect } from "solid-js";
import type { SortMode } from "../utils/sort";

export type TabId = "current" | "parent" | "playlist";

// Tab 状态不需要缓存，每次刷新默认 current
export const [activeTab, setActiveTab] = createSignal<TabId>("current");

// 排序和 Pin 状态，像 muted.ts 一样从 localStorage 恢复并自动持久化
const getStoredSortMode = (): SortMode => {
  return (localStorage.getItem("vidviewer_sort") as SortMode) || "name";
};

const getStoredPinned = (): boolean => {
  return localStorage.getItem("vidviewer_pinned") === "true";
};

export const [sortMode, setSortMode] = createSignal<SortMode>(getStoredSortMode());
export const [isPinned, setIsPinned] = createSignal<boolean>(getStoredPinned());

createRoot(() => {
  createEffect(() => {
    localStorage.setItem("vidviewer_sort", sortMode());
    localStorage.setItem("vidviewer_pinned", String(isPinned()));
  });
});
// src/store/directory.ts
import { createSignal, createMemo, createEffect } from "solid-js";
import { type FileNode } from "../utils/parser";
import { fetchDirectory } from "../api/directory";
import { sortItems } from "../utils/sort";
import { sortMode } from "./sidebarUI";
import { currentUrl, parentUrl } from "./urlPath"; // 👈 引入统一的 url 状态

export const [currentItems, setCurrentItems] = createSignal<FileNode[]>([]);
export const [currentLoading, setCurrentLoading] = createSignal<boolean>(true);
export const [currentError, setCurrentError] = createSignal<string | null>(null);

export const [parentItems, setParentItems] = createSignal<FileNode[]>([]);
export const [parentLoading, setParentLoading] = createSignal<boolean>(false);
export const [parentError, setParentError] = createSignal<string | null>(null);

// 已经 fetch 过 parent 了吗
export const parentFetched = createMemo(
  () => parentItems().length > 0 || parentError() !== null
);

// 唯一的排序入口
export const sortedCurrentItems = createMemo(() =>
  sortItems(currentItems(), sortMode())
);

export const sortedParentItems = createMemo(() =>
  sortItems(parentItems(), sortMode())
);

// 兄弟目录
export const sortedSiblingDirs = createMemo(() =>
  sortedParentItems().filter((f) => f.isDirectory)
);

const fetchItems = async (
  targetUrl: string,
  setLoading: (v: boolean) => void,
  setError: (v: string | null) => void,
  setItems: (v: FileNode[]) => void,
) => {
  setLoading(true);
  setError(null);
  try {
    const { items } = await fetchDirectory(targetUrl);
    setItems(items);
  } catch (err: any) {
    setError(err.message || "未知错误");
  } finally {
    setLoading(false);
  }
};

export const fetchCurrent = (url: string) =>
  fetchItems(url, setCurrentLoading, setCurrentError, setCurrentItems);

export const fetchParent = () => {
  const p = parentUrl();
  if (!p) return;
  fetchItems(p, setParentLoading, setParentError, setParentItems);
};

// ✨ 核心驱动：只要 currentUrl 发生改变，自动拉取当前目录数据
createEffect(() => {
  fetchCurrent(currentUrl());
});
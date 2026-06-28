// src/store/directory.ts
import { createSignal, createMemo, createEffect } from "solid-js";
import { type FileNode } from "../utils/parser";
import { fetchDirectory } from "../api/directory";
import { sortItems } from "../utils/sort";
import { sortMode } from "./sidebarUI";

export const [currentUrl, setCurrentUrl] = createSignal<string>(
  new URL(".", window.location.href).href,
);

export const parentUrl = () => {
  const url = new URL(currentUrl());
  if (url.pathname === "/" || url.pathname === "") return null;
  return new URL("../", url.href).href;
};

export const [currentItems, setCurrentItems] = createSignal<FileNode[]>([]);
export const [currentLoading, setCurrentLoading] = createSignal<boolean>(true);
export const [currentError, setCurrentError] = createSignal<string | null>(null);

export const [parentItems, setParentItems] = createSignal<FileNode[]>([]);
export const [parentLoading, setParentLoading] = createSignal<boolean>(false);
export const [parentError, setParentError] = createSignal<string | null>(null);

// 已经 fetch 过 parent 了吗（用 memo 从 parentItems 推导，空文件夹 + error 都算 fetched）
export const parentFetched = createMemo(
  () => parentItems().length > 0 || parentError() !== null
);



// ✨ 唯一的排序入口：按当前 sortMode 排好的 current / parent 完整列表（含文件+目录）
// Sidebar 显示和 Lightbox 翻页都必须读这两个 memo，不能各自再 sortItems 一遍
// —— random 模式下，独立调用 sortItems 等于各自重新洗牌，顺序必然不一致
export const sortedCurrentItems = createMemo(() =>
  sortItems(currentItems(), sortMode())
);

export const sortedParentItems = createMemo(() =>
  sortItems(parentItems(), sortMode())
);

// 兄弟目录：从 sortedParentItems 过滤而来，不重新排序
// 所以顺序和 Sidebar 实际展示的顺序（包括 random 洗牌结果）完全一致
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


createEffect(() => {
fetchCurrent(currentUrl());
});
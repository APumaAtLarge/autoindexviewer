
// src/store/directory.ts
import { createSignal } from "solid-js";
import { type FileNode } from "../utils/parser";
import { fetchDirectory } from "../api/directory";

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
export const [parentFetched, setParentFetched] = createSignal<boolean>(false);

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
  setParentFetched(true);
  fetchItems(p, setParentLoading, setParentError, setParentItems);
};
// src/store/urlPath.ts
import { createSignal, createMemo } from "solid-js";

// 初始化时优先读取浏览器当前的真实 URL 目录
const initialUrl = new URL(".", window.location.href).href;

export const [currentUrl, setCurrentUrl] = createSignal<string>(initialUrl);

// 计算父目录 URL
export const parentUrl = createMemo(() => {
  try {
    const url = new URL(currentUrl());
    if (url.pathname === "/" || url.pathname === "") return null;
    return new URL("../", url.href).href;
  } catch {
    return null;
  }
});

// 统一的路径跳转网关：负责同步 Signal 与浏览器历史记录
export const navigateToDir = (url: string) => {
  if (currentUrl() === url) return;
  
  setCurrentUrl(url);
  if (window.location.href !== url) {
    window.history.pushState(null, "", url);
  }
};
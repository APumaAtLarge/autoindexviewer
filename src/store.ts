// src/store.ts
import { createSignal } from "solid-js";

// 将 videoUrl 做成响应式导出，方便跨组件读取和更新
export const [videoUrl, setVideoUrl] = createSignal<string>("");
export const [isHls, setIsHls] = createSignal<boolean>(false);
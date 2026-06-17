// src/store/browseDir.ts
// 当前浏览目录的 signal。用 url + nonce 结构保证每次 navigate 都触发响应，
// 哪怕目标 URL 与上次相同。
import { createSignal } from "solid-js";

export interface BrowseDirPayload {
  url: string;
  nonce: number;
}

export const [browseDir, setBrowseDir] = createSignal<BrowseDirPayload | null>(null);

let _nonce = 0;

/** 导航到指定目录，每次调用都产生新 nonce 以强制触发订阅者 */
export const navigateDir = (url: string) =>
  setBrowseDir({ url, nonce: ++_nonce });

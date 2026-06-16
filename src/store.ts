// // src/store.ts
// import { createSignal } from "solid-js";

// // ── 当前播放 URL ──────────────────────────────────────────
// export const [videoUrl, setVideoUrl] = createSignal<string>("");
// export const [isHls,    setIsHls]    = createSignal<boolean>(false);

// // ── 侧边栏浏览目录 ────────────────────────────────────────
// export const [browseDir, setBrowseDir] = createSignal<string | null>(null);

// // ── 播放列表 ──────────────────────────────────────────────
// export interface PlaylistItem {
//   url:  string;
//   name: string;
// }

// export const [playlist, setPlaylist] = createSignal<PlaylistItem[]>([]);


// src/store.ts
import { createSignal } from "solid-js";

export const [videoUrl, setVideoUrl] = createSignal<string>("");
export const [isHls,    setIsHls]    = createSignal<boolean>(false);

// url + nonce，保证每次 set 都触发 effect，哪怕 url 相同
export interface BrowseDirPayload {
  url: string;
  nonce: number;
}
export const [browseDir, setBrowseDir] = createSignal<BrowseDirPayload | null>(null);

// 便捷 setter：每次都生成新 nonce
let _nonce = 0;
export const navigateDir = (url: string) =>
  setBrowseDir({ url, nonce: ++_nonce });

export interface PlaylistItem {
  url:  string;
  name: string;
}
export const [playlist, setPlaylist] = createSignal<PlaylistItem[]>([]);
// src/store.ts
import { createSignal } from "solid-js";

// ── 当前播放 URL ──────────────────────────────────────────
export const [videoUrl, setVideoUrl] = createSignal<string>("");
export const [isHls,    setIsHls]    = createSignal<boolean>(false);

// ── 侧边栏浏览目录 ────────────────────────────────────────
export const [browseDir, setBrowseDir] = createSignal<string | null>(null);

// ── 播放列表 ──────────────────────────────────────────────
export interface PlaylistItem {
  url:  string;
  name: string;
}

export const [playlist, setPlaylist] = createSignal<PlaylistItem[]>([]);

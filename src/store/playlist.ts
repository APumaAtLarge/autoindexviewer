// src/store/playlist.ts
// 播放列表 signal，启动时从 localStorage 恢复，变化时自动持久化。
import { createSignal, createRoot, createEffect } from "solid-js";

export interface PlaylistItem {
  url:  string;
  name: string;
}

const STORAGE_KEY = "vidviewer_playlist";

const getStoredPlaylist = (): PlaylistItem[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (err) {
    console.error("读取播放列表缓存失败:", err);
    return [];
  }
};

export const [playlist, setPlaylist] = createSignal<PlaylistItem[]>(getStoredPlaylist());

createRoot(() => {
  createEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(playlist()));
    } catch (err) {
      console.error("写入播放列表缓存失败:", err);
    }
  });
});

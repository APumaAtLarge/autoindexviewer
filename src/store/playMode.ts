// src/store/playMode.ts
// 播放模式 signal，启动时从 localStorage 恢复，变化时自动持久化。
import { createSignal, createRoot, createEffect } from "solid-js";

/** normal = 顺序播完停止 | list = 列表循环 | single = 单曲循环 | shuffle = 随机播放 */
export type PlayMode = "normal" | "list" | "single" | "shuffle";

const PLAY_MODE_KEY = "vidviewer_playmode";

const getStoredPlayMode = (): PlayMode => {
  try {
    const v = localStorage.getItem(PLAY_MODE_KEY);
    if (v === "normal" || v === "list" || v === "single" || v === "shuffle") return v;
  } catch {}
  return "normal";
};

export const [playMode, setPlayMode] = createSignal<PlayMode>(getStoredPlayMode());

createRoot(() => {
  createEffect(() => {
    try {
      localStorage.setItem(PLAY_MODE_KEY, playMode());
    } catch (err) {
      console.error("写入播放模式缓存失败:", err);
    }
  });
});

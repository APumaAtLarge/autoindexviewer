// src/store/muted.ts
// 静音状态 signal，启动时从 localStorage 恢复，变化时自动持久化。
import { createSignal, createRoot, createEffect } from "solid-js";

const MUTED_KEY = "vidviewer_muted";

const getStoredMuted = (): boolean => {
  try {
    return localStorage.getItem(MUTED_KEY) === "true";
  } catch (err) {
    console.error("读取静音配置缓存失败:", err);
    return false;
  }
};

export const [isMuted, setIsMuted] = createSignal<boolean>(getStoredMuted());

createRoot(() => {
  createEffect(() => {
    try {
      localStorage.setItem(MUTED_KEY, String(isMuted()));
    } catch (err) {
      console.error("写入静音配置缓存失败:", err);
    }
  });
});

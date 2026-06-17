// // src/store.ts
// import { createSignal, createRoot, createEffect } from "solid-js";

// export const [videoUrl, setVideoUrl] = createSignal<string>("");
// export const [isHls,    setIsHls]    = createSignal<boolean>(false);


// // ── 静音状态：初始化时从 localStorage 读取 ─────────────────
// const MUTED_KEY = "vidviewer_muted";
// const getStoredMuted = (): boolean => {
//   try {
//     return localStorage.getItem(MUTED_KEY) === "true";
//   } catch (err) {
//     console.error("读取静音配置缓存失败:", err);
//     return false;
//   }
// };
// export const [isMuted, setIsMuted] = createSignal<boolean>(getStoredMuted());
// // url + nonce，保证每次 set 都触发 effect，哪怕 url 相同
// export interface BrowseDirPayload {
//   url: string;
//   nonce: number;
// }
// export const [browseDir, setBrowseDir] = createSignal<BrowseDirPayload | null>(null);

// // 便捷 setter：每次都生成新 nonce
// let _nonce = 0;
// export const navigateDir = (url: string) =>
//   setBrowseDir({ url, nonce: ++_nonce });

// export interface PlaylistItem {
//   url:  string;
//   name: string;
// }

// // ── 1. 初始化：尝试从 localStorage 读取历史数据 ─────────────────
// const STORAGE_KEY = "vidviewer_playlist";
// const getStoredPlaylist = (): PlaylistItem[] => {
//   try {
//     const stored = localStorage.getItem(STORAGE_KEY);
//     return stored ? JSON.parse(stored) : [];
//   } catch (err) {
//     console.error("读取播放列表缓存失败:", err);
//     return [];
//   }
// };

// // 使用缓存的数据初始化 Signal
// export const [playlist, setPlaylist] = createSignal<PlaylistItem[]>(getStoredPlaylist());

// // ── 2. 持久化：利用 createRoot 开启全局监听，自动同步到本地 ───────
// createRoot(() => {
//   createEffect(() => {
//     try {
//       localStorage.setItem(STORAGE_KEY, JSON.stringify(playlist()));
//     } catch (err) {
//       console.error("写入播放列表缓存失败:", err);
//     }
//   });
// });

// createRoot(() => {
// createEffect(() => {
//   try {
//     localStorage.setItem(STORAGE_KEY, JSON.stringify(playlist()));
//   } catch (err) {
//     console.error("写入播放列表缓存失败:", err);
//   }
// });

// createEffect(() => {
//   try {
//     localStorage.setItem(MUTED_KEY, String(isMuted()));
//   } catch (err) {
//     console.error("写入静音配置缓存失败:", err);
//   }
// });
// });

// src/store.ts
import { createSignal, createRoot, createEffect } from "solid-js";

// ── URL 参数名（与 player.ts 共用） ─────────────────────────
export const VIDEO_PARAM = "v";
export const TIME_PARAM  = "t";

// ── 启动时从地址栏恢复视频 + 播放进度 ────────────────────────
function _getInitialVideoFromUrl(): { url: string; hls: boolean } | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const v = params.get(VIDEO_PARAM);
    if (!v) return null;
    return { url: v, hls: /\.m3u8(\?|#|$)/i.test(v) };
  } catch {
    return null;
  }
}

function _getInitialTimeFromUrl(): number | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const t = params.get(TIME_PARAM);
    if (t === null) return null;
    const n = Number(t);
    return Number.isFinite(n) && n >= 0 ? n : null;
  } catch {
    return null;
  }
}

const _restoredVideo = _getInitialVideoFromUrl();

export const [videoUrl, setVideoUrl] = createSignal<string>(_restoredVideo?.url ?? "");
export const [isHls,    setIsHls]    = createSignal<boolean>(_restoredVideo?.hls ?? false);

// 只在第一次创建播放器时消费一次，避免之后切视频也被错误地 seek
let _pendingInitialTime: number | null = _getInitialTimeFromUrl();
export function consumeInitialPlaybackTime(): number | null {
  const t = _pendingInitialTime;
  _pendingInitialTime = null;
  return t;
}

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

// ── 1. 初始化：尝试从 localStorage 读取历史数据 ─────────────────
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

// ── 静音状态：初始化时从 localStorage 读取 ─────────────────
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

// ── 2. 持久化：利用 createRoot 开启全局监听，自动同步到本地 / 地址栏 ───────
createRoot(() => {
  createEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(playlist()));
    } catch (err) {
      console.error("写入播放列表缓存失败:", err);
    }
  });

  createEffect(() => {
    try {
      localStorage.setItem(MUTED_KEY, String(isMuted()));
    } catch (err) {
      console.error("写入静音配置缓存失败:", err);
    }
  });

  // videoUrl 变化时同步到地址栏的 v 参数（不动 t，进度由 player.ts 单独维护）
  createEffect(() => {
    const url = videoUrl();
    try {
      const u = new URL(window.location.href);
      if (url) {
        u.searchParams.set(VIDEO_PARAM, url);
      } else {
        u.searchParams.delete(VIDEO_PARAM);
      }
      history.replaceState(history.state, "", u.toString());
    } catch (err) {
      console.error("同步视频 URL 失败:", err);
    }
  });
});
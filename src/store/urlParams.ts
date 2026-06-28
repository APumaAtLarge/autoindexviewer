// src/store/urlParams.ts
import { createSignal, createRoot, createEffect } from "solid-js";

export const VIDEO_PARAM = "v";
export const TIME_PARAM = "t";

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
export const [isHls, setIsHls] = createSignal<boolean>(_restoredVideo?.hls ?? false);

// ✨ 新增：播放进度的 Signal，初始值直接从 URL 读取
export const [playbackTime, setPlaybackTime] = createSignal<number>(_getInitialTimeFromUrl() ?? 0);

// ✨ 统一管理：一个 Effect 负责同步所有 URL 参数
createRoot(() => {
createEffect(() => {
  const url = videoUrl();
  const time = playbackTime();

  try {
    const u = new URL(window.location.href);

    if (url) {
      // Player 显示时
      // u.searchParams.set(VIDEO_PARAM, url);
      u.searchParams.set(TIME_PARAM, String(time));
    } else {
      // Player 隐藏时
      // u.searchParams.delete(VIDEO_PARAM);
      u.searchParams.delete(TIME_PARAM);
    }

    history.replaceState(history.state, "", u.toString());
  } catch (err) {
    console.error("同步 URL 参数失败:", err);
  }
});
});
// createRoot(() => {
//   createEffect(() => {
//     const url = videoUrl();
//     const time = playbackTime();

//     try {
//       const u = new URL(window.location.href);

//       // // 同步视频 URL 参数
//       // if (url) {
//       //   u.searchParams.set(VIDEO_PARAM, url);
//       // } else {
//       //   u.searchParams.delete(VIDEO_PARAM);
//       // }

//       // 同步时间参数
//       u.searchParams.set(TIME_PARAM, String(time));

//       history.replaceState(history.state, "", u.toString());
//     } catch (err) {
//       console.error("同步 URL 参数失败:", err);
//     }
//   });
// });
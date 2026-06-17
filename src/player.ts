// // src/player.ts
// import Player, { Events } from "xgplayer";
// import HlsPlugin from "xgplayer-hls";
// import "xgplayer/dist/index.min.css";
// import { playlist, setPlaylist, videoUrl, setVideoUrl, isHls, isMuted, setIsMuted } from "./store";

// let instance: Player | null = null;
// let mountEl: HTMLElement | null = null;

// export function mountPlayer(el: HTMLElement) {
//   mountEl = el;
//   const url = videoUrl();
//   if (url) _createPlayer(url);
// }

// export function unmountPlayer() {
//   mountEl = null;
// }

// export function destroyPlayer() {
//   if (instance) {
//     instance.destroy();
//     instance = null;
//   }
//   mountEl = null;
// }

// export function switchVideo(url: string) {
//   if (!url) return;

//   if (instance) {
//     instance.src = url;
//     instance.play().then(_applyMuted).catch(() => { });
//     return;
//   }

//   if (mountEl) {
//     _createPlayer(url);
//   }
// }

// /** 切换静音状态，同时同步到播放器实例和 store */
// export function toggleMute() {
//   setIsMuted(!isMuted());
//   _applyMuted();
// }

// export function addToPlaylist(url: string, name?: string) {
//   const current = playlist();
//   if (current.some((item) => item.url === url)) return;
//   setPlaylist([...current, { url, name: name ?? url.split("/").pop() ?? url }]);
// }

// export function removeFromPlaylist(url: string) {
//   setPlaylist(playlist().filter((item) => item.url !== url));
// }

// // ── 内部 ──────────────────────────────────────────────────

// /** 把 store 里真正的静音偏好补回播放器实例 */
// function _applyMuted() {
//   if (instance) instance.muted = isMuted();
// }

// function _createPlayer(url: string) {
//   if (!mountEl) return;
//   if (instance) {
//     instance.destroy();
//     instance = null;
//   }

//   const config: any = {
//     el: mountEl,
//     url,
//     width: "100%",
//     height: "100%",
//     videoFillMode: "contain",
//     autoplay: true,
//     volume: 0.6,
//     lang: "zh-cn",
//     playbackRate: [0.5, 0.75, 1, 1.25, 1.5, 2],
//     pip: true,
//     cssFullscreen: true,
//     download: !isHls(),
//   };

//   if (isHls()) config.plugins = [HlsPlugin];

//   instance = new Player(config);

//   // autoplay:true 会让 xgplayer 内部强制以静音开始播放，
//   // 必须等 ready / playing 之后再把真实偏好补回去，不能依赖 config
//   instance.on(Events.READY, _applyMuted);
//   instance.on(Events.PLAYING, _applyMuted);

//   // 用户点了播放器自带的静音按钮时，回写到 store
//   instance.on(Events.VOLUME_CHANGE, () => {
//     if (instance) setIsMuted(instance.muted);
//   });

//   instance.on(Events.ENDED, _playNext);
// }

// function _playNext() {
//   const list = playlist();
//   const cur = videoUrl();
//   const idx = list.findIndex((i) => i.url === cur);
//   if (idx >= 0 && idx < list.length - 1) {
//     const next = list[idx + 1];
//     setVideoUrl(next.url);
//     switchVideo(next.url);
//   }
// }


// src/player.ts
// 全局单例 XGPlayer 实例管理器
// VideoPlayer.tsx 只负责提供挂载容器，实际创建/销毁/切换由这里统一处理。

import Player, { Events } from "xgplayer";
import HlsPlugin from "xgplayer-hls";
import "xgplayer/dist/index.min.css";
import {
  playlist, setPlaylist,
  videoUrl, setVideoUrl,
  isHls,
  isMuted, setIsMuted,
  TIME_PARAM, consumeInitialPlaybackTime,
} from "./store";

let instance: Player | null = null;
let mountEl: HTMLElement | null = null;

/** 把播放器挂载到指定容器（组件 onMount 时调用） */
export function mountPlayer(el: HTMLElement) {
  mountEl = el;
  const url = videoUrl();
  if (url) _createPlayer(url);
}

/** 组件卸载时调用：只解除引用，不销毁实例（切换路由时保留播放状态） */
export function unmountPlayer() {
  mountEl = null;
}

/** 彻底销毁实例（页面卸载 / 主动重置时调用） */
export function destroyPlayer() {
  if (instance) {
    instance.destroy();
    instance = null;
  }
  mountEl = null;
}

/** 切换视频 URL，若实例存在则直接 src 切换，否则重新创建 */
export function switchVideo(url: string) {
  if (!url) return;

  if (instance) {
    _setTimeInUrl(0); // 切到新视频，先清掉旧进度，避免短暂的新旧不匹配
    instance.src = url;
    instance.play().then(_applyMuted).catch(() => {});
    return;
  }

  if (mountEl) {
    _createPlayer(url);
  }
}

/** 切换静音状态，同时同步到播放器实例和 store */
export function toggleMute() {
  setIsMuted(!isMuted());
  _applyMuted();
}

/** 将当前视频追加到播放列表 */
export function addToPlaylist(url: string, name?: string) {
  const current = playlist();
  if (current.some((item) => item.url === url)) return;
  setPlaylist([...current, { url, name: name ?? url.split("/").pop() ?? url }]);
}

/** 从播放列表移除 */
export function removeFromPlaylist(url: string) {
  setPlaylist(playlist().filter((item) => item.url !== url));
}

// ── 内部 ──────────────────────────────────────────────────

function _applyMuted() {
  if (instance) instance.muted = isMuted();
}

/** 把当前播放秒数写入地址栏的 t 参数（replaceState，不刷新、不产生历史记录） */
function _setTimeInUrl(seconds: number) {
  try {
    const u = new URL(window.location.href);
    u.searchParams.set(TIME_PARAM, String(seconds));
    history.replaceState(history.state, "", u.toString());
  } catch (err) {
    console.error("同步播放进度到 URL 失败:", err);
  }
}

function _createPlayer(url: string) {
  if (!mountEl) return;
  if (instance) {
    instance.destroy();
    instance = null;
  }

  // 只有页面刚加载、且地址栏带了 t 参数时才会非 null，且只消费一次
  const seekTo = consumeInitialPlaybackTime();
  if (seekTo === null) {
    _setTimeInUrl(0); // 新视频，清掉上一个视频残留的进度
  }

  const config: any = {
    el: mountEl,
    url,
    width: "100%",
    height: "100%",
    videoFillMode: "contain",
    autoplay: true,
    volume: 0.6,
    lang: "zh-cn",
    playbackRate: [0.5, 0.75, 1, 1.25, 1.5, 2],
    pip: true,
    cssFullscreen: true,
    download: !isHls(),
  };

  if (isHls()) config.plugins = [HlsPlugin];

  instance = new Player(config);

  instance.on(Events.READY, _applyMuted);
  instance.on(Events.PLAYING, _applyMuted);

  instance.on(Events.VOLUME_CHANGE, () => {
    if (instance) setIsMuted(instance.muted);
  });

  // 地址栏带了进度（比如别人分享的链接），能 seek 的时候跳过去
  if (seekTo !== null) {
    let seeked = false;
    instance.on(Events.CANPLAY, () => {
      if (!seeked && instance) {
        instance.currentTime = seekTo;
        seeked = true;
      }
    });
  }

  // 播放进度同步到地址栏，节流到整秒变化才写一次
  let lastSyncedSecond = -1;
  instance.on(Events.TIME_UPDATE, () => {
    if (!instance) return;
    const sec = Math.floor(instance.currentTime);
    if (sec !== lastSyncedSecond) {
      lastSyncedSecond = sec;
      _setTimeInUrl(sec);
    }
  });

  instance.on(Events.ENDED, _playNext);
}

function _playNext() {
  const list = playlist();
  const cur  = videoUrl();
  const idx  = list.findIndex((i) => i.url === cur);
  if (idx >= 0 && idx < list.length - 1) {
    const next = list[idx + 1];
    setVideoUrl(next.url);
    switchVideo(next.url);
  }
}
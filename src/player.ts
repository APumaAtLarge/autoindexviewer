// src/player.ts
// 全局单例 XGPlayer 实例管理器
// VideoPlayer.tsx 只负责提供挂载容器，实际创建/销毁/切换由这里统一处理。

import Player from "xgplayer";
import HlsPlugin from "xgplayer-hls";
import "xgplayer/dist/index.min.css";
import { playlist, setPlaylist, videoUrl, setVideoUrl, isHls } from "./store";

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
    instance.src = url;
    instance.play().catch(() => {});
    return;
  }

  if (mountEl) {
    _createPlayer(url);
  }
}

/** 将当前视频追加到播放列表 */
export function addToPlaylist(url: string, name?: string) {
  const current = playlist();
  if (current.some((item) => item.url === url)) return; // 去重
  setPlaylist([...current, { url, name: name ?? url.split("/").pop() ?? url }]);
}

/** 从播放列表移除 */
export function removeFromPlaylist(url: string) {
  setPlaylist(playlist().filter((item) => item.url !== url));
}

// ── 内部 ──────────────────────────────────────────────────

function _createPlayer(url: string) {
  if (!mountEl) return;
  if (instance) {
    instance.destroy();
    instance = null;
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

  // 播完后自动播下一条
  instance.on("ended", _playNext);
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

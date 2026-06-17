import { setPlaylist, playlist } from "./store/playlist";
import Player, { Events } from "xgplayer";
import HlsPlugin from "xgplayer-hls";
import "xgplayer/dist/index.min.css";
import { setIsMuted, isMuted } from "./store/muted";
// ✨ 引入新的 Signal 和常量
import { videoUrl, setVideoUrl, isHls, playbackTime, setPlaybackTime, TIME_PARAM } from "./store/urlParams";
import { playMode } from "./store/playMode";

let instance: Player | null = null;
let mountEl: HTMLElement | null = null;

/** 把播放器挂载到指定容器 */
export function mountPlayer(el: HTMLElement) {
  mountEl = el;
  const url = videoUrl();
  if (url) _createPlayer(url);
}

/** 组件卸载时调用 */
export function unmountPlayer() {
  mountEl = null;
}

/** 彻底销毁实例 */
export function destroyPlayer() {
  if (instance) {
    instance.destroy();
    instance = null;
  }
  mountEl = null;
}

/** 切换视频 URL */
export function switchVideo(url: string) {
  if (!url) return;

  if (instance) {
    // ✨ 直接通过 Signal 将时间归零
    setPlaybackTime(0);
    instance.src = url;
    instance.play().then(_applyMuted).catch(() => {});
    return;
  }

  if (mountEl) {
    _createPlayer(url);
  }
}

// ── 内部 ──────────────────────────────────────────────────

export function _applyMuted() {
  if (instance) instance.muted = isMuted();
}

function _createPlayer(url: string) {
  if (!mountEl) return;
  if (instance) {
    instance.destroy();
    instance = null;
  }

  // ✨ 获取初始播放时间（由于只在创建时读取一次，天然等同于 consume 的效果）
  const seekTo = playbackTime();

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

  // ✨ 如果初始时间大于 0，则在可以播放时跳转进度
  if (seekTo > 0) {
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
      // ✨ 更改 Signal 状态，自动触发 urlParams.ts 中的 Effect 同步到 URL
      setPlaybackTime(sec);
    }
  });

  instance.on(Events.ENDED, _handleEnded);
}

function _handleEnded() {
  const mode = playMode();

  if (mode === "single") {
    if (instance) {
      instance.currentTime = 0;
      instance.play().catch(() => {});
    }
    return;
  }

  const list = playlist();
  const cur  = videoUrl();
  const idx  = list.findIndex((i) => i.url === cur);

  if (mode === "shuffle") {
    if (list.length <= 1) return;
    let nextIdx: number;
    do {
      nextIdx = Math.floor(Math.random() * list.length);
    } while (nextIdx === idx && list.length > 1);
    const next = list[nextIdx];
    setVideoUrl(next.url);
    switchVideo(next.url);
    return;
  }

  if (mode === "list") {
    if (list.length === 0) return;
    const nextIdx = idx >= list.length - 1 ? 0 : idx + 1;
    const next = list[nextIdx];
    setVideoUrl(next.url);
    switchVideo(next.url);
    return;
  }

  if (idx >= 0 && idx < list.length - 1) {
    const next = list[idx + 1];
    setVideoUrl(next.url);
    switchVideo(next.url);
  }
}


/** 暂停播放（移动端暂停后浏览器会自动允许息屏） */
export function pausePlayer() {
  if (instance) {
    instance.pause();
  }
}
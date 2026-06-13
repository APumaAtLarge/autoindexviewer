// src/VideoPlayer.tsx
import { createEffect, onCleanup, Show } from "solid-js";
import Player from "xgplayer";
import HlsPlugin from "xgplayer-hls";
import "xgplayer/dist/index.min.css";
import { videoUrl, isHls } from "./store";
import "./VideoPlayer.scss";
export function VideoPlayer() {
  let containerRef!: HTMLDivElement;
  let player: Player | null = null;

  // 使用 createEffect：当 videoUrl 发生变化时，自动重新加载播放器
  createEffect(() => {
    const url = videoUrl();
    if (!url) return;

    // 如果已经有实例存在，先销毁旧实例（支持无缝切换视频）
    if (player) {
      player.destroy();
      player = null;
    }

    const playerConfig: any = {
      el: containerRef,
      url: url,
      fluid: true,
      videoFillMode: "contain", // 🌟 替代 fitVideoSize，确保视频完整显示
      autoplay: true,
      volume: 0.6,
      lang: "zh-cn",
      playbackRate: [0.5, 0.75, 1, 1.25, 1.5, 2],
      pip: true,
      cssFullscreen: true,
      download: !isHls(),
    };

    if (isHls()) {
      playerConfig.plugins = [HlsPlugin];
    }

    player = new Player(playerConfig);

    player.on("play", () => {
      console.log("XGPlayer: 视频开始播放");
    });
  });

  // 组件卸载时清理内存
  onCleanup(() => {
    if (player) {
      player.destroy();
    }
  });

  return (
    <Show when={videoUrl()}>
      <div class="VideoPlayer">
        <div class="title">XGPlayer 视频播放器 {isHls() ? "(HLS流)" : ""}</div>
        <div class="player-container" ref={containerRef}></div>
      </div>
    </Show>
  );
}

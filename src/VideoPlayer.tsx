// src/VideoPlayer.tsx
import { createEffect, onMount, onCleanup, Show } from "solid-js";
import { videoUrl, isHls } from "./store";
import { mountPlayer, unmountPlayer, switchVideo } from "./player";
import "./VideoPlayer.scss";

export function VideoPlayer() {
  let containerRef!: HTMLDivElement;

  // 组件挂载：把容器交给 player 单例
  onMount(() => mountPlayer(containerRef));

  // 组件卸载：解除容器引用（不销毁实例）
  onCleanup(() => unmountPlayer());

  // videoUrl 变化时通知单例切换视频
  createEffect(() => {
    const url = videoUrl();
    if (url) switchVideo(url);
  });

  return (
    <Show when={videoUrl()}>
      <div class="VideoPlayer">
        <div class="title">
          {isHls() ? "▶ HLS 流" : "▶ 视频播放器"}
        </div>
        {/*
          伪元素占位：padding-top: 56.25% = 16:9
          容器自身高度为 0，由 padding 撑开，子元素绝对定位填满。
          这样无论外部宽度如何变化，比例永远锁定，不会变形。
        */}
        <div class="player-wrapper">
          <div class="player-container" ref={containerRef} />
        </div>
      </div>
    </Show>
  );
}

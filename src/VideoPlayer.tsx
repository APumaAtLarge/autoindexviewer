// src/VideoPlayer.tsx
import { createEffect, onMount, onCleanup, Show } from "solid-js";
import { videoUrl, isHls } from "./store";
import { mountPlayer, unmountPlayer, switchVideo } from "./player";
import { trashFile } from "./db"; // 引入 db 操作
import "./VideoPlayer.scss";
import toast from "./ui/toast";
export function VideoPlayer() {
  let containerRef!: HTMLDivElement;

  onMount(() => mountPlayer(containerRef));
  onCleanup(() => unmountPlayer());

  createEffect(() => {
    const url = videoUrl();
    if (url) switchVideo(url);
  });

  // 处理删除逻辑
  const handleDelete = async () => {
    const currentUrl = videoUrl();
    if (!currentUrl) return;

    // 从当前 URL 推断目录和文件名
    const lastSlashIdx = currentUrl.lastIndexOf("/");
    if (lastSlashIdx === -1) return;

    const dirUri = currentUrl.substring(0, lastSlashIdx + 1);
    const fileName = decodeURIComponent(currentUrl.substring(lastSlashIdx + 1));

    try {
      await trashFile(dirUri, currentUrl, fileName);
      toast.success(`已将 "${fileName}" 移入垃圾桶`);
      // 注意：这里仅写入了 IndexedDB，当前视频仍在播放
    } catch (err) {
      console.error("删除失败", err);
      toast.error("删除失败，请查看控制台");
    }
  };

  return (
    <Show when={videoUrl()}>
      <div class="VideoPlayer">
        {/* 将 title 包裹在 header 容器中 */}
        <div class="header">
          <div class="title">{isHls() ? "▶ HLS 流" : "▶ 视频播放器"}</div>
          <button class="delete-btn" onClick={handleDelete}>
            删除文件
          </button>
        </div>

        <div class="player-wrapper">
          <div class="player-container" ref={containerRef} />
        </div>
      </div>
    </Show>
  );
}

// // src/VideoPlayer.tsx
// import { createEffect, onMount, onCleanup, Show } from "solid-js";
// import { videoUrl, isHls } from "./store";
// import { mountPlayer, unmountPlayer, switchVideo } from "./player";
// import "./VideoPlayer.scss";

// export function VideoPlayer() {
//   let containerRef!: HTMLDivElement;

//   // 组件挂载：把容器交给 player 单例
//   onMount(() => mountPlayer(containerRef));

//   // 组件卸载：解除容器引用（不销毁实例）
//   onCleanup(() => unmountPlayer());

//   // videoUrl 变化时通知单例切换视频
//   createEffect(() => {
//     const url = videoUrl();
//     if (url) switchVideo(url);
//   });

//   return (
//     <Show when={videoUrl()}>
//       <div class="VideoPlayer">
//         <div class="title">
//           {isHls() ? "▶ HLS 流" : "▶ 视频播放器"}
//         </div>
//         {/*
//           伪元素占位：padding-top: 56.25% = 16:9
//           容器自身高度为 0，由 padding 撑开，子元素绝对定位填满。
//           这样无论外部宽度如何变化，比例永远锁定，不会变形。
//         */}
//         <div class="player-wrapper">
//           <div class="player-container" ref={containerRef} />
//         </div>
//       </div>
//     </Show>
//   );
// }

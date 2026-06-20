// src/VideoPlayer.tsx
// ✨ 注意引入 createSignal
import { createEffect, onMount, onCleanup, Show, createSignal } from "solid-js";
import { videoUrl, isHls } from "./store/urlParams";
// ✨ 引入 pausePlayer
import { mountPlayer, unmountPlayer, switchVideo, pausePlayer } from "./player";
import { trashFile } from "./db/trash"; 
// ✨ 引入封装好的 API
import { apiDeleteFile } from "./api/trash";
import "./VideoPlayer.scss";
import toast from "./ui/toast";

export function VideoPlayer() {
  let containerRef!: HTMLDivElement;
  
  // ✨ 新增：睡眠定时器状态与 ID
  const [sleepActive, setSleepActive] = createSignal(false);
  let sleepTimerId: number | null = null;

  onMount(() => mountPlayer(containerRef));
  
  onCleanup(() => {
    unmountPlayer();
    // ✨ 组件卸载时清理定时器，防内存泄漏
    if (sleepTimerId) window.clearTimeout(sleepTimerId);
  });

  createEffect(() => {
    const url = videoUrl();
    if (url) switchVideo(url);
  });

  // ✨ 新增：切换 30 分钟定时逻辑
  const toggleSleepTimer = () => {
    if (sleepActive()) {
      // 取消定时
      setSleepActive(false);
      if (sleepTimerId) window.clearTimeout(sleepTimerId);
      toast.success("已取消定时关闭");
    } else {
      // 开启定时 (30分钟 = 30 * 60 * 1000 毫秒)
      setSleepActive(true);
      toast.success("将在 30 分钟后停止播放，允许手机自动息屏");
      sleepTimerId = window.setTimeout(() => {
        pausePlayer(); // 暂停视频，浏览器自动释放阻止息屏的机制
        setSleepActive(false);
        toast.success("定时已结束，视频已暂停");
      }, 30 * 60 * 1000); 
    }
  };

  const handleDelete = async () => {
    const currentUrl = videoUrl();
    if (!currentUrl) return;

    const lastSlashIdx = currentUrl.lastIndexOf("/");
    if (lastSlashIdx === -1) return;

    const dirUri = currentUrl.substring(0, lastSlashIdx + 1);
    const fileName = decodeURIComponent(currentUrl.substring(lastSlashIdx + 1));

    const isConfirmed = await toast.confirm(`确定要将 "${fileName}" 移入垃圾桶吗？`);
    if (!isConfirmed) return; 

    try {
      // await trashFile(dirUri, currentUrl, fileName);
      // ✨ 直接调用 API 函数，没有延迟
      await apiDeleteFile(dirUri, currentUrl, fileName);
      toast.success(`已将 "${fileName}" 移入垃圾桶`);
    } catch (err) {
      console.error("删除失败", err);
      toast.error("删除失败，请查看控制台");
    }
  };

  return (
    <Show when={videoUrl()}>
      <div class="VideoPlayer">
        <div class="header">
          <div class="title">{isHls() ? "▶ HLS 流" : "▶ 视频播放器"}</div>
          
          {/* ✨ 新增：用一个 actions 容器包裹两个按钮 */}
          <div class="actions">
            <button 
              class={`sleep-btn ${sleepActive() ? 'active' : ''}`} 
              onClick={toggleSleepTimer}
            >
              {sleepActive() ? '⏰ 取消定时' : '⏱️ 30分定时'}
            </button>
            <button class="delete-btn" onClick={handleDelete}>
              删除文件
            </button>
          </div>
        </div>

        <div class="player-wrapper">
          <div class="player-container" ref={containerRef} />
        </div>
      </div>
    </Show>
  );
}
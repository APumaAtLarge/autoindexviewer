// src/Sidebar.tsx
import { createSignal, onMount, For, Show } from "solid-js";
import { parseNginxHtml, type FileNode } from "./utils/parser";
import { videoUrl, setVideoUrl, setIsHls } from "./store";
import "./Sidebar.scss";

// 🌟 定义接收的 Props 类型
interface SidebarProps {
  isOpen: boolean;
  isMobile: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar = (props: SidebarProps) => {
  const [items, setItems] = createSignal<FileNode[]>([]);
  const [loading, setLoading] = createSignal<boolean>(true);
  const [error, setError] = createSignal<string | null>(null);

  onMount(async () => {
    // ... 原有 fetch 逻辑保持不变 ...
    try {
      const targetFetchUrl = new URL(".", window.location.href).href;
      const response = await fetch(targetFetchUrl);
      if (!response.ok) throw new Error(`请求失败: ${response.status}`);
      const htmlText = await response.text();
      const result = parseNginxHtml(htmlText, targetFetchUrl);
      setItems(result.items);
    } catch (err: any) {
      setError(err.message || "未知错误");
    } finally {
      setLoading(false);
    }
  });

  const isVideoFile = (url: string) => {
    return /\.(mp4|m3u8|mkv|avi|mov|webm)$/i.test(url);
  };

  const handleItemClick = (item: FileNode) => {
    // 🌟 核心修复：只有在移动端窄屏下，点击才需要自动折叠侧边栏！桌面端直接无视
    if (props.isMobile) {
      props.setIsOpen(false);
    }

    if (!item.isDirectory && isVideoFile(item.url)) {
      // 播放视频单页逻辑
      setVideoUrl(item.url);
      window.history.pushState(null, "", item.url);
    } else {
      // 文件夹跳转逻辑
      window.location.href = item.url;
    }
  };

  return (
    <>
      {/* 🌟 这里的按钮已经删除了，保持干净 */}

      {/* 🌟 绑定父级传下来的 props.isOpen */}
      <div classList={{ Sidebar: true, open: props.isOpen }}>
        <div class="header">
          <h3>📂 媒体目录</h3>
          <span class="subtitle">当前目录层级</span>
        </div>

        <Show when={loading()}>
          <div class="status">正在载入目录...</div>
        </Show>

        <Show when={error()}>
          <div class="status error">❌ {error()}</div>
        </Show>

        <Show when={!loading() && !error()}>
          <ul class="list">
            <For each={items()}>
              {(item) => (
                <li
                  classList={{
                    item: true,
                    dir: item.isDirectory,
                    file: !item.isDirectory,
                    active: item.isDirectory
                      ? window.location.href === item.url
                      : videoUrl() === item.url,
                  }}
                  onClick={() => handleItemClick(item)}
                  title={item.name}
                >
                  <span class="icon">{item.isDirectory ? "📁" : "🎬"}</span>
                  <span class="name">{item.name}</span>
                </li>
              )}
            </For>
          </ul>
        </Show>
      </div>

      {/* 🌟 点击遮罩层，调用父级传入的 setter 关闭侧边栏 */}
      <div class="sidebar-mask" onClick={() => props.setIsOpen(false)}></div>
    </>
  );
};

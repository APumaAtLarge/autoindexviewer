// src/DirectoryView.tsx
import { createSignal, onMount, onCleanup, createEffect, Show } from "solid-js";
import { type FileNode } from "./utils/parser";
import { fetchDirectory } from "./api/directory";
// import { setVideoUrl, setIsHls, browseDir, navigateDir } from "./store.ts.bak";
import { browseDir,navigateDir } from "./store/browseDir";
import { setVideoUrl,setIsHls } from "./store/urlParams";
import { isImageUrl } from "./utils/isImage";
import { DirectoryGrid } from "./DirectoryGrid"; // 引入拆分出的组件
import "./DirectoryView.scss";

export function DirectoryView() {
  const [files, setFiles] = createSignal<FileNode[]>([]);
  const [title, setTitle] = createSignal<string>("载入中...");
  const [loading, setLoading] = createSignal<boolean>(false);
  const [currentUrl, setCurrentUrl] = createSignal<string>(
    window.location.href,
  );

  const isCurrentPageImage = () => isImageUrl(currentUrl());

  const parentDirUrl = () => {
    try {
      const url = new URL(currentUrl());
      const lastSlashIdx = url.pathname.lastIndexOf("/");
      if (lastSlashIdx !== -1) {
        url.pathname = url.pathname.substring(0, lastSlashIdx + 1);
      }
      return url.href;
    } catch {
      return "";
    }
  };

  const isVideoFile = (url: string) =>
    /\.(mp4|m3u8|mkv|avi|mov|webm)$/i.test(url);

  const loadDirectory = async (url: string) => {
    setCurrentUrl(url);

    if (isImageUrl(url)) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setTitle("载入中...");
    setFiles([]);

    try {
      const { title: parsedTitle, items } = await fetchDirectory(url);
      setTitle(parsedTitle);
      setFiles(items);
    } catch (err) {
      console.error("解析 Nginx 目录失败:", err);
      setTitle("❌ 解析目录失败");
    } finally {
      setLoading(false);
    }
  };

  onMount(() => {
    if (!browseDir()) {
      loadDirectory(window.location.href);
    }
    const onPopState = () => loadDirectory(window.location.href);
    window.addEventListener("popstate", onPopState);
    onCleanup(() => window.removeEventListener("popstate", onPopState));
  });

  createEffect(() => {
    const payload = browseDir();
    if (payload) loadDirectory(payload.url);
  });

  // const handleCardClick = (e: MouseEvent, file: FileNode) => {
  //   if (file.isDirectory) {
  //     e.preventDefault();
  //     window.history.pushState(null, "", file.url);
  //     navigateDir(file.url);
  //   } else if (isVideoFile(file.url)) {
  //     e.preventDefault();
  //     const isM3u8 = /\.m3u8$/i.test(file.url);
  //     setIsHls(isM3u8);
  //     setVideoUrl(file.url);
  //     window.history.pushState(null, "", file.url);
  //   } else if (isImageUrl(file.url)) {
  //     e.preventDefault();
  //     window.history.pushState(null, "", file.url);
  //     loadDirectory(file.url);
  //   }
  // };
  // src/DirectoryView.tsx 里的 handleCardClick 函数
  const handleCardClick = (e: MouseEvent, file: FileNode) => {
    if (file.isDirectory) {
      e.preventDefault();
      window.history.pushState(null, "", file.url);
      navigateDir(file.url);
    } else if (isVideoFile(file.url)) {
      e.preventDefault();
      const isM3u8 = /\.m3u8$/i.test(file.url);
      setIsHls(isM3u8);
      setVideoUrl(file.url);
      window.history.pushState(null, "", file.url);
    }
    // ❌ 彻底删掉下面这段对 isImageUrl 的 else if 拦截！
    // 这样普通的图片点击就不会触发 URL 切换和 DOM 销毁，GLightbox 插件会自动调用 e.preventDefault() 并完美弹窗。
  };
  const handleBackToDir = (e: MouseEvent) => {
    e.preventDefault();
    const dest = parentDirUrl();
    if (dest) {
      window.history.pushState(null, "", dest);
      navigateDir(dest);
    }
  };

  return (
    <div class="DirectoryView">
      <Show when={loading()}>
        <div class="dir-loading">⏳ 正在载入...</div>
      </Show>

      <Show when={!loading()}>
        <Show
          when={isCurrentPageImage()}
          fallback={
            <DirectoryGrid
              title={title()}
              files={files()}
                currentUrl={currentUrl()}
              onCardClick={handleCardClick}
            />
          }
        >
          {/* 单张图片预览页面 */}
          <div class="image-preview-view">
            <div class="preview-header">
              <button class="back-dir-btn" onClick={handleBackToDir}>
                ⬅️ 返回当前目录
              </button>
              <span class="image-name">
                {decodeURIComponent(
                  currentUrl().substring(currentUrl().lastIndexOf("/") + 1),
                )}
              </span>
            </div>
            <div class="image-container">
              <img src={currentUrl()} alt="Preview" class="preview-img" />
            </div>
          </div>
        </Show>
      </Show>
    </div>
  );
}
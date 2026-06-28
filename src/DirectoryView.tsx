// src/DirectoryView.tsx
import { createSignal, onMount, onCleanup, createEffect, Show } from "solid-js";
import { type FileNode } from "./utils/parser";
import { fetchDirectory } from "./api/directory";
import { browseDir, navigateDir } from "./store/browseDir";
import { setVideoUrl, setIsHls } from "./store/urlParams";
import { DirectoryGrid } from "./DirectoryGrid";
import "./DirectoryView.scss";

export function DirectoryView() {
  const [files, setFiles] = createSignal<FileNode[]>([]);
  const [title, setTitle] = createSignal<string>("载入中...");
  const [loading, setLoading] = createSignal<boolean>(false);

  const isVideoFile = (url: string) =>
    /\.(mp4|m3u8|mkv|avi|mov|webm)$/i.test(url);

  const loadDirectory = async (url: string) => {
    setLoading(true);
    setTitle("载入中...");
    setFiles([]);
    try {
      const { title: parsedTitle, items } = await fetchDirectory(url);
      setTitle(parsedTitle);
      setFiles(items);
    } catch (err) {
      console.error("解析目录失败:", err);
      setTitle("❌ 解析目录失败");
    } finally {
      setLoading(false);
    }
  };

  onMount(() => {
    if (!browseDir()) loadDirectory(window.location.href);
    const onPopState = () => loadDirectory(window.location.href);
    window.addEventListener("popstate", onPopState);
    onCleanup(() => window.removeEventListener("popstate", onPopState));
  });

  createEffect(() => {
    const payload = browseDir();
    if (payload) loadDirectory(payload.url);
  });

  const handleCardClick = (_e: MouseEvent, file: FileNode) => {
    if (file.isDirectory) {
      window.history.pushState(null, "", file.url);
      navigateDir(file.url);
    } else if (isVideoFile(file.url)) {
      const isM3u8 = /\.m3u8$/i.test(file.url);
      setIsHls(isM3u8);
      setVideoUrl(file.url);
      window.history.pushState(null, "", file.url);
    }
  };

  return (
    <div class="DirectoryView">
      <Show when={loading()}>
        <div class="dir-loading">⏳ 正在载入...</div>
      </Show>
      <Show when={!loading()}>
        <DirectoryGrid
          title={title()}
          files={files()}
          currentUrl={window.location.href}
          onCardClick={handleCardClick}
        />
      </Show>
    </div>
  );
}

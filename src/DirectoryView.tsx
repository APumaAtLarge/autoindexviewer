import {
  createSignal,
  onMount,
  onCleanup,
  createEffect,
  For,
  Show,
} from "solid-js";
import GLightbox from "glightbox";
import "glightbox/dist/css/glightbox.min.css";
import { parseNginxHtml, type FileNode } from "./utils/parser";
import { setVideoUrl, setIsHls } from "./store";
import { isImageUrl } from "./utils/isImage";
import "./DirectoryView.scss";
import { browseDir } from "./store"; // 🌟 加这个
export function DirectoryView() {
  const [files, setFiles] = createSignal<FileNode[]>([]);
  const [title, setTitle] = createSignal<string>("载入中...");
  const [loading, setLoading] = createSignal<boolean>(false);
  let lightbox: ReturnType<typeof GLightbox> | null = null;

  const isVideoFile = (url: string) =>
    /\.(mp4|m3u8|mkv|avi|mov|webm)$/i.test(url);

  const initLightbox = () => {
    lightbox?.destroy();
    lightbox = GLightbox({
      selector: ".glightbox",
      touchNavigation: true,
      loop: true,
      zoomable: true,
      draggable: true,
      openEffect: "zoom",
    });
  };

  // 🌟 抽出加载目录的核心逻辑，供初始化和点击文件夹复用
  const loadDirectory = async (url: string) => {
    setLoading(true);
    setTitle("载入中...");
    setFiles([]);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("网络请求失败");
      const htmlText = await response.text();
      const { title: parsedTitle, items } = parseNginxHtml(htmlText, url);
      setTitle(parsedTitle);
      setFiles(items);
      queueMicrotask(initLightbox);
    } catch (err) {
      console.error("解析 Nginx 目录失败:", err);
      setTitle("解析目录失败");
    } finally {
      setLoading(false);
    }
  };

  onMount(() => {
    loadDirectory(window.location.href);

    // 🌟 监听浏览器前进/后退，重新加载对应目录
    const onPopState = () => {
      loadDirectory(window.location.href);
    };
    window.addEventListener("popstate", onPopState);
    onCleanup(() => window.removeEventListener("popstate", onPopState));
  });

  onCleanup(() => lightbox?.destroy());

  // 🌟 响应侧边栏的目录切换
  createEffect(() => {
    const dir = browseDir();
    if (dir) loadDirectory(dir);
  });

  const handleCardClick = (e: MouseEvent, file: FileNode) => {
    if (!file.isDirectory && isVideoFile(file.url)) {
      e.preventDefault();
      const isM3u8 = /\.m3u8$/i.test(file.url);
      setIsHls(isM3u8);
      setVideoUrl(file.url);
      window.history.pushState(null, "", file.url);
    }
    // 图片：glightbox 自己处理点击，不需要额外逻辑
    // 文件夹：自然跳转
  };
  //   const handleCardClick = (e: MouseEvent, file: FileNode) => {
  //     e.preventDefault(); // 🌟 统一拦截所有 <a> 的默认跳转

  //     if (file.isDirectory) {
  //       // 🌟 文件夹：SPA 内切换，更新 URL
  //       window.history.pushState(null, "", file.url);
  //       loadDirectory(file.url);
  //     } else if (isVideoFile(file.url)) {
  //       // 视频：单页播放
  //       const isM3u8 = /\.m3u8$/i.test(file.url);
  //       setIsHls(isM3u8);
  //       setVideoUrl(file.url);
  //       window.history.pushState(null, "", file.url);
  //     } else if (isImageUrl(file.url)) {
  //       // 图片：放给 glightbox 处理，需要手动触发
  //       (e.currentTarget as HTMLAnchorElement).dispatchEvent(
  //         new MouseEvent("click", { bubbles: false })
  //       );
  //     } else {
  //       // 其他文件：正常下载/跳转
  //       window.location.href = file.url;
  //     }
  //   };

  return (
    <div class="DirectoryView">
      {/* 🌟 加载态 */}
      <Show when={loading()}>
        <div class="dir-loading">⏳ 正在载入...</div>
      </Show>

      <Show when={!loading()}>
        <h2 class="dir-title">🗂️ {title()}</h2>
        <div class="file-grid">
          <For each={files()}>
            {(file) => {
              const imgSrc =
                file.cover ?? (isImageUrl(file.url) ? file.url : null);
              const isImg = !file.isDirectory && isImageUrl(file.url);

              return (
                <a
                  href={file.url}
                  classList={{
                    "file-card": true,
                    "is-dir": file.isDirectory,
                    glightbox: isImg,
                  }}
                  data-gallery="dir-images"
                  data-title={isImg ? file.name : undefined}
                  title={file.name}
                  onClick={(e) => handleCardClick(e, file)}
                >
                  <div class="cover-wrapper">
                    <Show
                      when={imgSrc}
                      fallback={
                        <div class="icon">{file.isDirectory ? "📁" : "📄"}</div>
                      }
                    >
                      {(src) => (
                        <>
                          <img
                            src={src()}
                            alt={file.name}
                            class="cover-img"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                              const icon = e.currentTarget
                                .nextElementSibling as HTMLElement;
                              if (icon) icon.style.display = "block";
                            }}
                          />
                          <div class="default-icon icon" style="display: none;">
                            {file.isDirectory
                              ? "📁"
                              : file.metadata
                                ? "🎬"
                                : "📄"}
                          </div>
                        </>
                      )}
                    </Show>
                  </div>

                  <div class="name">{file.name}</div>

                  <Show when={file.metadata}>
                    <div class="file-meta">
                      <span class="size">{file.metadata!.size}</span>
                      <span class="date">{file.metadata!.date}</span>
                    </div>
                  </Show>
                </a>
              );
            }}
          </For>
        </div>
      </Show>
    </div>
  );
}

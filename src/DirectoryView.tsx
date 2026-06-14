import { createSignal, onMount, onCleanup, For, Show } from "solid-js";
import GLightbox from "glightbox";
import "glightbox/dist/css/glightbox.min.css";
import { parseNginxHtml, type FileNode } from "./utils/parser";
import { setVideoUrl, setIsHls } from "./store";
import { isImageUrl } from "./utils/isImage";
import "./DirectoryView.scss";

export function DirectoryView() {
  const [files, setFiles] = createSignal<FileNode[]>([]);
  const [title, setTitle] = createSignal<string>("载入中...");
  let lightbox: ReturnType<typeof GLightbox> | null = null;

  const isVideoFile = (url: string) =>
    /\.(mp4|m3u8|mkv|avi|mov|webm)$/i.test(url);

  // 初始化 / 刷新灯箱
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

  onMount(async () => {
    try {
      const response = await fetch(window.location.href);
      if (!response.ok) throw new Error("网络请求失败");
      const htmlText = await response.text();
      const { title: parsedTitle, items } = parseNginxHtml(htmlText);
      setTitle(parsedTitle);
      setFiles(items);
      // DOM 更新后初始化灯箱
      queueMicrotask(initLightbox);
    } catch (err) {
      console.error("解析 Nginx 目录失败:", err);
      setTitle("解析目录失败");
    }
  });

  onCleanup(() => lightbox?.destroy());

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

  return (
    <div class="DirectoryView">
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
    </div>
  );
}

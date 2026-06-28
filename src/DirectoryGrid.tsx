// src/DirectoryGrid.tsx
import { For, Show } from "solid-js";
import { type FileNode } from "./utils/parser";
import { isImageUrl } from "./utils/isImage";
// 👇 1. 引入我们的纯函数
import { openDirectoryLightbox } from "./components/DirectoryLightbox"; 
import "./DirectoryGrid.scss";

interface DirectoryGridProps {
  title: string;
  files: FileNode[];
  currentUrl: string;
  onCardClick: (e: MouseEvent, file: FileNode) => void;
}

export function DirectoryGrid(props: DirectoryGridProps) {
  return (
    <>
      <h2 class="dir-title">🗂️ {props.title}</h2>
      <div class="file-grid">
        <For each={props.files}>
          {(file) => {
            const imgSrc = file.cover ?? (isImageUrl(file.url) ? file.url : null);
            const isImg = !file.isDirectory && isImageUrl(file.url);

            return (
              <a
                href={file.url}
                classList={{
                  "file-card": true,
                  "is-dir": file.isDirectory,
                  // 🗑️ 删除了原来的 glightbox class 绑定
                }}
                title={file.name}
                onClick={(e) => {
                  e.preventDefault(); // 永远阻止原生 a 标签跳转

                  if (isImg) {
                    // 👇 🌟 2. 如果是图片，直接把当前的文件列表和被点中的文件传进去打开！
                    openDirectoryLightbox(props.files, file);
                  } else {
                    // 非图片，正常进入文件夹逻辑
                    props.onCardClick(e, file);
                  }
                }}
              >
                <div class="cover-wrapper">
                  <Show
                    when={imgSrc}
                    fallback={<div class="icon">{file.isDirectory ? "📁" : "📄"}</div>}
                  >
                    {(src) => (
                      <>
                        <img
                          src={src()}
                          alt={file.name}
                          class="cover-img"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            const icon = e.currentTarget.nextElementSibling as HTMLElement;
                            if (icon) icon.style.display = "block";
                          }}
                        />
                        <div class="default-icon icon" style="display: none;">
                          {file.isDirectory ? "📁" : file.metadata ? "🎬" : "📄"}
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
      
      {/* 🗑️ 删除了底部的 <DirectoryLightbox /> 挂载点，DOM 更干净了 */}
    </>
  );
}
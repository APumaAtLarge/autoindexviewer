// src/FileCard.tsx
import { createSignal, Show } from "solid-js";
import { type FileNode } from "./utils/parser";
import { isImageUrl } from "./utils/isImage";
import { openDirectoryLightbox } from "./components/DirectoryLightbox";
import "./FileCard.scss";

interface FileCardProps {
  file: FileNode;
  files: FileNode[]; // 传递完整列表供 Lightbox 使用
  currentUrl: string; // 传递当前 URL 供 Lightbox 使用
  onCardClick: (e: MouseEvent, file: FileNode) => void;
}
// src/FileCard.tsx

function getVideoThumbUrl(urlStr: string): string {
  try {
    const url = new URL(urlStr);

    // 此时 url.pathname 就是 "/www-data/%E4%..."
    // 正则精确匹配第一级目录（/www-data）并替换为 /thumb
    url.pathname = url.pathname.replace(/^\/[^/]+/, "/thumb");

    // 拼回完整的带 http:// 的链接，并加上 .jpg
    return url.href + ".jpg";
  } catch (e) {
    // 容错降级
    return urlStr + ".jpg";
  }
}
export function FileCard(props: FileCardProps) {
  const { file } = props;

  const defaultSrc = file.cover ?? (isImageUrl(file.url) ? file.url : null);
  const isVideo =
    !file.isDirectory && /\.(mp4|m3u8|mkv|avi|mov|webm)$/i.test(file.url);

  const [imgSrc, setImgSrc] = createSignal<string | null>(
    defaultSrc ?? (isVideo ? getVideoThumbUrl(file.url) : null),
  );

  const isImg = !file.isDirectory && isImageUrl(file.url);

  return (
    <a
      href={file.url}
      classList={{
        "file-card": true,
        "is-dir": file.isDirectory,
      }}
      style={{ flex: "1", "min-width": "0" }}
      title={file.name}
      onClick={(e) => {
        e.preventDefault();
        if (isImg) {
          openDirectoryLightbox(props.files, file, props.currentUrl);
        } else {
          props.onCardClick(e, file);
        }
      }}
    >
      <div class="cover-wrapper">
        <Show
          when={imgSrc()}
          fallback={<div class="icon">{file.isDirectory ? "📁" : "📄"}</div>}
        >
          {(src) => (
            <>
              <img
                src={src()}
                alt={file.name}
                class="cover-img"
                loading="lazy"
                onError={(e) => {
                  if (isVideo && imgSrc()?.endsWith(".jpg")) {
                    setImgSrc(file.url);
                  } else {
                    e.currentTarget.style.display = "none";
                    const icon = e.currentTarget
                      .nextElementSibling as HTMLElement;
                    if (icon) icon.style.display = "block";
                  }
                }}
              />
              <div class="default-icon icon" style="display:none">
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
}

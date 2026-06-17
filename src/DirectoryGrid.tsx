// src/DirectoryGrid.tsx
import { For, Show, onCleanup, createEffect } from "solid-js";
import GLightbox from "glightbox";
import "glightbox/dist/css/glightbox.min.css";
import { type FileNode } from "./utils/parser";
import { isImageUrl } from "./utils/isImage";
import "./DirectoryGrid.scss";

interface DirectoryGridProps {
  title: string;
  files: FileNode[];
  onCardClick: (e: MouseEvent, file: FileNode) => void;
}

export function DirectoryGrid(props: DirectoryGridProps) {
  let lightbox: ReturnType<typeof GLightbox> | null = null;

  // 记录当前图片的旋转角度
  let currentRotation = 0;

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

    // 存储打开 Lightbox 前的目录 URL，以便关闭时恢复
    let baseDirUrl = window.location.href;

    // ── 1. 监听打开事件 ──
    lightbox.on("open", () => {
      baseDirUrl = window.location.href;
      injectRotationButton();
    });

    // ── 2. 监听左右切换事件：同步反映图片 URL ──
    lightbox.on("slide_changed", (({ prev, current }: any) => {
      // 每次切换图片，重置旋转角度
      currentRotation = 0;

      // 从当前幻灯片配置中获取图片的完整 URL
      const fileUrl = current?.slideConfig?.href;
      if (fileUrl) {
        // 更新浏览器地址栏，不刷新页面
        window.history.pushState(null, "", fileUrl);
      }
    }) as any);

    // ── 3. 监听关闭事件：恢复目录 URL 并移除按钮 ──
    lightbox.on("close", () => {
      window.history.pushState(null, "", baseDirUrl);
      removeRotationButton();
    });
  };

  // ── 动态注入旋转按钮 ──
  const injectRotationButton = () => {
    if (document.getElementById("glightbox-rotate-btn")) return;

    const container = document.querySelector(".glightbox-container");
    if (!container) return;

    const rotateBtn = document.createElement("button");
    rotateBtn.id = "glightbox-rotate-btn";
    rotateBtn.innerHTML = "🔄 旋转";
    rotateBtn.className = "grotate-btn";

    rotateBtn.addEventListener("click", () => {
      // 找到当前处于激活状态的幻灯片 DOM
      const activeSlide = document.querySelector(".gslide.current");
      if (!activeSlide) return;

      const img = activeSlide.querySelector(".gslide-image img") as HTMLElement;
      if (img) {
        currentRotation = (currentRotation + 90) % 360;

        // 核心算法：因为你在样式中强制了 img 是 95vw 和 95vh，
        // 当宽屏图片旋转 90/270 度变成纵向时，高度会溢出视口。
        // 这里计算一个智能缩放比例（Scale），确保旋转后依然完美等比视口居中、不被裁切。
        if (currentRotation === 90 || currentRotation === 270) {
          const windowWidth = window.innerWidth;
          const windowHeight = window.innerHeight;
          const imgWidth = img.offsetWidth;
          const imgHeight = img.offsetHeight;

          // 计算旋转后所需的缩放比
          const scaleFactor = Math.min(
            (windowWidth * 0.9) / imgHeight,
            (windowHeight * 0.9) / imgWidth,
            1,
          );
          img.style.transform = `rotate(${currentRotation}deg) scale(${scaleFactor})`;
        } else {
          img.style.transform = `rotate(${currentRotation}deg) scale(1)`;
        }

        img.style.transition = "transform 0.3s ease";
      }
    });

    // 将按钮塞进 Lightbox 全屏容器中
    container.appendChild(rotateBtn);
  };

  // ── 移除旋转按钮 ──
  const removeRotationButton = () => {
    const btn = document.getElementById("glightbox-rotate-btn");
    btn?.remove();
  };

  createEffect(() => {
    if (props.files.length >= 0) {
      queueMicrotask(initLightbox);
    }
  });

  onCleanup(() => {
    lightbox?.destroy();
    removeRotationButton();
  });

  return (
    <>
      <h2 class="dir-title">🗂️ {props.title}</h2>
      <div class="file-grid">
        <For each={props.files}>
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
                  glightbox: isImg, // 保持 Lightbox 触发类
                }}
                data-gallery="dir-images"
                data-title={isImg ? file.name : undefined}
                title={file.name}
                onClick={(e) => props.onCardClick(e, file)}
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
    </>
  );
}

// // src/DirectoryGrid.tsx
// import { For, Show, onCleanup, createEffect } from "solid-js";
// import GLightbox from "glightbox";
// import "glightbox/dist/css/glightbox.min.css";
// import { type FileNode } from "./utils/parser";
// import { isImageUrl } from "./utils/isImage";
// import "./DirectoryGrid.scss"; // 👈 检查这一行加了没有！
// interface DirectoryGridProps {
//   title: string;
//   files: FileNode[];
//   onCardClick: (e: MouseEvent, file: FileNode) => void;
// }

// export function DirectoryGrid(props: DirectoryGridProps) {
//   let lightbox: ReturnType<typeof GLightbox> | null = null;

//   const initLightbox = () => {
//     lightbox?.destroy();
//     lightbox = GLightbox({
//       selector: ".glightbox",
//       touchNavigation: true,
//       loop: true,
//       zoomable: true,
//       draggable: true,
//       openEffect: "zoom",
//     });
//   };

//   // 监听 files 变化，数据更新且 DOM 渲染完成后重新初始化 Lightbox
//   createEffect(() => {
//     if (props.files.length >= 0) {
//       queueMicrotask(initLightbox);
//     }
//   });

//   onCleanup(() => lightbox?.destroy());

//   return (
//     <>
//       <h2 class="dir-title">🗂️ {props.title}</h2>
//       <div class="file-grid">
//         <For each={props.files}>
//           {(file) => {
//             const imgSrc = file.cover ?? (isImageUrl(file.url) ? file.url : null);
//             const isImg = !file.isDirectory && isImageUrl(file.url);

//             return (
//               <a
//                 href={file.url}
//                 classList={{
//                   "file-card": true,
//                   "is-dir": file.isDirectory,
//                   glightbox: isImg,
//                 }}
//                 data-gallery="dir-images"
//                 data-title={isImg ? file.name : undefined}
//                 title={file.name}
//                 onClick={(e) => props.onCardClick(e, file)}
//               >
//                 <div class="cover-wrapper">
//                   <Show
//                     when={imgSrc}
//                     fallback={<div class="icon">{file.isDirectory ? "📁" : "📄"}</div>}
//                   >
//                     {(src) => (
//                       <>
//                         <img
//                           src={src()}
//                           alt={file.name}
//                           class="cover-img"
//                           onError={(e) => {
//                             e.currentTarget.style.display = "none";
//                             const icon = e.currentTarget.nextElementSibling as HTMLElement;
//                             if (icon) icon.style.display = "block";
//                           }}
//                         />
//                         <div class="default-icon icon" style="display: none;">
//                           {file.isDirectory ? "📁" : file.metadata ? "🎬" : "📄"}
//                         </div>
//                       </>
//                     )}
//                   </Show>
//                 </div>
//                 <div class="name">{file.name}</div>
//                 <Show when={file.metadata}>
//                   <div class="file-meta">
//                     <span class="size">{file.metadata!.size}</span>
//                     <span class="date">{file.metadata!.date}</span>
//                   </div>
//                 </Show>
//               </a>
//             );
//           }}
//         </For>
//       </div>
//     </>
//   );
// }

// // src/DirectoryGrid.tsx
// import { For, Show, onCleanup, createEffect } from "solid-js";
// import GLightbox from "glightbox";
// import "glightbox/dist/css/glightbox.min.css";
// import { type FileNode } from "./utils/parser";
// import { isImageUrl } from "./utils/isImage";
// import {
//   getSiblingDirs,
//   findNextNonEmptySibling,
// } from "./utils/siblingFolder";
// import "./DirectoryGrid.scss";

// interface DirectoryGridProps {
//   title: string;
//   files: FileNode[];
//   currentUrl: string; // 当前目录 URL，用于定位“下一个文件夹”
//   onCardClick: (e: MouseEvent, file: FileNode) => void;
// }

// export function DirectoryGrid(props: DirectoryGridProps) {
//   let lightbox: ReturnType<typeof GLightbox> | null = null;

//   // 记录当前图片的旋转角度
//   let currentRotation = 0;

//   // ── 跨目录循环续播相关状态 ──
//   let destroyed = false;
//   let chainInitStarted = false;
//   let chain: {
//     dirs: FileNode[];
//     currentIndex: number;
//     cursor: number; // 上一次成功追加的兄弟目录下标（环形游标）
//     totalSlides: number; // 画廊里当前一共有多少张 slide
//     latestBatchStart: number; // 最近一批追加内容的起始 slide 下标
//     loading: boolean;
//     exhausted: boolean; // 已经绕回起点，不用再继续找了
//   } | null = null;

//   // 继续往后找一个含图片的兄弟目录并追加到画廊末尾
//   const loadNextChainBatch = async () => {
//     if (!chain || chain.loading || chain.exhausted || destroyed) return;
//     chain.loading = true;

//     const match = await findNextNonEmptySibling(
//       chain.dirs,
//       chain.cursor,
//       chain.currentIndex,
//     );

//     if (destroyed || !chain) return;

//     if (!match) {
//       chain.exhausted = true; // 绕回起点了，剩下交给 loop:true 闭环
//       chain.loading = false;
//       return;
//     }

//     const batchStart = chain.totalSlides;
//     match.images.forEach((img) => {
//       (lightbox as any)?.insertSlide({
//         href: img.url,
//         type: "image",
//         title: img.name,
//       });
//     });

//     chain.cursor = match.index;
//     chain.totalSlides += match.images.length;
//     chain.latestBatchStart = batchStart;
//     chain.loading = false;
//   };

//   // 打开 lightbox 后，第一次初始化“兄弟目录环”，并加载第一批
//   const ensureChainInit = async (dirUrl: string) => {
//     const siblings = await getSiblingDirs(dirUrl);
//     if (destroyed) return;
//     if (!siblings) {
//       chain = null; // 找不到父目录/定位失败，不做跨目录续播
//       return;
//     }

//     const originalImageCount = props.files.filter(
//       (f) => !f.isDirectory && isImageUrl(f.url),
//     ).length;

//     chain = {
//       dirs: siblings.dirs,
//       currentIndex: siblings.currentIndex,
//       cursor: siblings.currentIndex,
//       totalSlides: originalImageCount,
//       latestBatchStart: originalImageCount,
//       loading: false,
//       exhausted: false,
//     };

//     await loadNextChainBatch();
//   };

//   const initLightbox = () => {
//     destroyed = false;
//     chainInitStarted = false;
//     chain = null; // 目录变了，旧的“兄弟目录环”失效

//     lightbox?.destroy();
//     lightbox = GLightbox({
//       selector: ".glightbox",
//       touchNavigation: true,
//       loop: true,
//       zoomable: true,
//       draggable: true,
//       openEffect: "zoom",
//     });

//     // 存储打开 Lightbox 前的目录 URL，以便关闭时恢复
//     let baseDirUrl = window.location.href;

//     // ── 1. 监听打开事件 ──
//     lightbox.on("open", () => {
//       baseDirUrl = window.location.href;
//       injectRotationButton();

//       // 打开后立即初始化兄弟目录环并加载第一批，每个目录只做一次
//       if (!chainInitStarted) {
//         chainInitStarted = true;
//         ensureChainInit(props.currentUrl);
//       }
//     });

//     // ── 2. 监听左右切换事件：同步反映图片 URL，并按需续载下一批 ──
//     lightbox.on("slide_changed", (({ prev, current }: any) => {
//       // 每次切换图片，重置旋转角度
//       currentRotation = 0;

//       // 从当前幻灯片配置中获取图片的完整 URL
//       const fileUrl = current?.slideConfig?.href;
//       if (fileUrl) {
//         // 更新浏览器地址栏，不刷新页面，方便直接刷新定位到这张图
//         window.history.pushState(null, "", fileUrl);
//       }

//       // 一旦翻进了“最近一批追加内容”的范围，就继续往后找下一个目录
//       if (
//         chain &&
//         !chain.exhausted &&
//         !chain.loading &&
//         typeof current?.index === "number" &&
//         current.index >= chain.latestBatchStart
//       ) {
//         loadNextChainBatch();
//       }
//     }) as any);

//     // ── 3. 监听关闭事件：恢复目录 URL 并移除按钮 ──
//     lightbox.on("close", () => {
//       window.history.pushState(null, "", baseDirUrl);
//       removeRotationButton();
//     });
//   };

//   // ── 动态注入旋转按钮 ──
//   const injectRotationButton = () => {
//     if (document.getElementById("glightbox-rotate-btn")) return;

//     const container = document.querySelector(".glightbox-container");
//     if (!container) return;

//     const rotateBtn = document.createElement("button");
//     rotateBtn.id = "glightbox-rotate-btn";
//     rotateBtn.innerHTML = "🔄 旋转";
//     rotateBtn.className = "grotate-btn";

//     rotateBtn.addEventListener("click", () => {
//       const activeSlide = document.querySelector(".gslide.current");
//       if (!activeSlide) return;

//       const img = activeSlide.querySelector(".gslide-image img") as HTMLElement;
//       if (img) {
//         currentRotation = (currentRotation + 90) % 360;

//         if (currentRotation === 90 || currentRotation === 270) {
//           const windowWidth = window.innerWidth;
//           const windowHeight = window.innerHeight;
//           const imgWidth = img.offsetWidth;
//           const imgHeight = img.offsetHeight;

//           const scaleFactor = Math.min(
//             (windowWidth * 0.9) / imgHeight,
//             (windowHeight * 0.9) / imgWidth,
//             1,
//           );
//           img.style.transform = `rotate(${currentRotation}deg) scale(${scaleFactor})`;
//         } else {
//           img.style.transform = `rotate(${currentRotation}deg) scale(1)`;
//         }

//         img.style.transition = "transform 0.3s ease";
//       }
//     });

//     container.appendChild(rotateBtn);
//   };

//   const removeRotationButton = () => {
//     const btn = document.getElementById("glightbox-rotate-btn");
//     btn?.remove();
//   };

//   createEffect(() => {
//     if (props.files.length >= 0) {
//       queueMicrotask(initLightbox);
//     }
//   });

//   onCleanup(() => {
//     destroyed = true;
//     lightbox?.destroy();
//     removeRotationButton();
//   });

//   return (
//     <>
//       <h2 class="dir-title">🗂️ {props.title}</h2>
//       <div class="file-grid">
//         <For each={props.files}>
//           {(file) => {
//             const imgSrc =
//               file.cover ?? (isImageUrl(file.url) ? file.url : null);
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
//                     fallback={
//                       <div class="icon">{file.isDirectory ? "📁" : "📄"}</div>
//                     }
//                   >
//                     {(src) => (
//                       <>
//                         <img
//                           src={src()}
//                           alt={file.name}
//                           class="cover-img"
//                           onError={(e) => {
//                             e.currentTarget.style.display = "none";
//                             const icon = e.currentTarget
//                               .nextElementSibling as HTMLElement;
//                             if (icon) icon.style.display = "block";
//                           }}
//                         />
//                         <div class="default-icon icon" style="display: none;">
//                           {file.isDirectory
//                             ? "📁"
//                             : file.metadata
//                               ? "🎬"
//                               : "📄"}
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

// src/DirectoryGrid.tsx
import { For, Show } from "solid-js";
import { type FileNode } from "./utils/parser";
import { isImageUrl } from "./utils/isImage";
import { DirectoryLightbox } from "./components/DirectoryLightbox"; // 引入我们新建的组件
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
                  glightbox: isImg, // 依然保留这个类名给 Lightbox 抓取
                }}
                data-gallery="dir-images"
                data-title={isImg ? file.name : undefined}
                title={file.name}
                onClick={(e) => props.onCardClick(e, file)}
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
      
      {/* 挂载 Lightbox 逻辑组件（不占据正常文档流位置） */}
      <DirectoryLightbox files={props.files} currentUrl={props.currentUrl} />
    </>
  );
}
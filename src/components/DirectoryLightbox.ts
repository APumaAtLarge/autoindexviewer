// src/components/DirectoryLightbox.ts
import PhotoSwipeLightbox from "photoswipe/lightbox";
import "photoswipe/style.css";
import { type FileNode } from "../utils/parser";
import { isImageUrl } from "../utils/isImage";

let lightbox: PhotoSwipeLightbox | null = null;
let baseDirUrl = "";

export async function openDirectoryLightbox(files: FileNode[], clickedFile: FileNode) {
  if (lightbox) {
    lightbox.destroy();
  }

  baseDirUrl = window.location.href;

  const images = files.filter((f) => !f.isDirectory && isImageUrl(f.url));
  const startIndex = images.findIndex((f) => f.url === clickedFile.url);

  if (startIndex === -1) return;


  // 只预取第一张和第二张的尺寸
  const preloadCount = Math.min(2, images.length - startIndex);
  const preloadTargets = images.slice(startIndex, startIndex + preloadCount);

  const sizeMap = new Map<string, { w: number; h: number }>();
  await Promise.all(
    preloadTargets.map(
      (img) =>
        new Promise<void>((resolve) => {
          const i = new Image();
          i.onload = () => { sizeMap.set(img.url, { w: i.naturalWidth, h: i.naturalHeight }); resolve(); };
          i.onerror = () => resolve();
          i.src = img.url;
        })
    )
  );


  const dataSource = images.map((img) => {
    const size = sizeMap.get(img.url);
    return { src: img.url, width: size?.w ?? 0, height: size?.h ?? 0, alt: img.name };
  });

  // lightbox = new PhotoSwipeLightbox({ dataSource, pswpModule: () => import("photoswipe"), wheelToZoom: true, bgOpacity: 0.9, padding: { top: 20, bottom: 20, left: 20, right: 20 } });
  // lightbox = new PhotoSwipeLightbox({
  //   dataSource,
  //   pswpModule: () => import("photoswipe"),
  //   wheelToZoom: true,
  //   bgOpacity: 0.9,
  //   padding: { top: 20, bottom: 20, left: 20, right: 20 },

  //   // 初始缩放：fit = 缩放到窗口内最大可显示尺寸（不超出）
  //   initialZoomLevel: "fit",
  //   // 次级缩放（双击/滚轮放大到的目标）：原始尺寸
  //   secondaryZoomLevel: 1,
  //   // 最大允许缩放
  //   maxZoomLevel: 2,
  // });
  lightbox = new PhotoSwipeLightbox({
    dataSource,
    pswpModule: () => import("photoswipe"),
    wheelToZoom: true,
    bgOpacity: 0.9,
    padding: { top: 20, bottom: 20, left: 20, right: 20 },

    // 强制按窗口缩放，不限制原始尺寸上限
    initialZoomLevel: (zoomLevelObject) => {
      const { elementSize, panAreaSize } = zoomLevelObject;
      const scaleX = panAreaSize.x / elementSize.x;
      const scaleY = panAreaSize.y / elementSize.y;
      // 取较小的那个方向，保证完整显示不裁切，允许超过 1:1 放大
      return Math.min(scaleX, scaleY);
    },
    // 双击回到原始尺寸
    secondaryZoomLevel: 1,
    maxZoomLevel: 3,
  });

  // contentLoad 仍然保留，处理其他未预加载的图片
  lightbox.on("contentLoad", (e) => {
    const { content } = e;
    if (content.type === "image" && content.width === 0) {
      const img = new Image();
      img.onload = () => {
        content.width = img.naturalWidth;
        content.height = img.naturalHeight;
        content.updateImage();
      };
      img.src = content.data.src as string;
    }
  });


  // 5. 同步 URL 变化
  lightbox.on("change", () => {
    const currSlide = lightbox?.pswp?.currSlide?.data;
    if (currSlide && currSlide.src) {
      window.history.pushState(null, "", currSlide.src);
    }
  });

  // 6. 关闭时恢复 URL
  lightbox.on("close", () => {
    window.history.pushState(null, "", baseDirUrl);
  });

  // 👇 🌟 核心修改：使用 loadAndOpen 传入起始索引并直接打开弹窗
  lightbox.loadAndOpen(startIndex);
}
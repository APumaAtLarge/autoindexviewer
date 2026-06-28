// src/components/DirectoryLightbox.ts
import PhotoSwipeLightbox from "photoswipe/lightbox";
import "photoswipe/style.css";
import { type FileNode } from "../utils/parser";
import { isImageUrl } from "../utils/isImage";
import { fetchDirectory } from "../api/directory";
import { navigateDir } from "../store/browseDir";
import { setCurrentUrl, fetchCurrent, fetchParent, parentFetched, sortedSiblingDirs } from "../store/directory";

let lightbox: PhotoSwipeLightbox | null = null;

async function fetchDirImages(dirUrl: string): Promise<FileNode[]> {
  try {
    const { items } = await fetchDirectory(dirUrl);
    return items.filter((f) => !f.isDirectory && isImageUrl(f.url));
  } catch {
    return [];
  }
}

// // 在已排序的兄弟目录列表里找 currentDirUrl 的下一个
// function findNextDir(currentDirUrl: string): FileNode | null {
//   const dirs = sortedSiblingDirs(); // 直接读 store，顺序和侧边栏完全一致
//   const idx = dirs.findIndex((f) => f.url === currentDirUrl);
//   if (idx === -1 || idx >= dirs.length - 1) return null;
//   return dirs[idx + 1];
// }



// 在已排序的兄弟目录列表里找 currentDirUrl 的下一个
// sortedSiblingDirs 已经和侧边栏展示顺序完全一致（含 random 模式），
// 这里直接读，不需要自己按 sortMode 再排一遍
function findNextDir(currentDirUrl: string): FileNode | null {
  const dirs = sortedSiblingDirs();
  const idx = dirs.findIndex((f) => f.url === currentDirUrl);
  if (idx === -1 || idx >= dirs.length - 1) return null;
  return dirs[idx + 1];
}


async function preloadSizes(
  imgs: FileNode[],
  count: number,
): Promise<Map<string, { w: number; h: number }>> {
  const map = new Map<string, { w: number; h: number }>();
  await Promise.all(
    imgs.slice(0, count).map(
      (img) =>
        new Promise<void>((resolve) => {
          const i = new Image();
          i.onload = () => { map.set(img.url, { w: i.naturalWidth, h: i.naturalHeight }); resolve(); };
          i.onerror = () => resolve();
          i.src = img.url;
        }),
    ),
  );
  return map;
}

function dirOfImage(imageUrl: string): string {
  return imageUrl.slice(0, imageUrl.lastIndexOf("/") + 1);
}

export async function openDirectoryLightbox(
  files: FileNode[],
  clickedFile: FileNode,
  currentDirUrl: string,
) {
  if (lightbox) lightbox.destroy();

  const images = files.filter((f) => !f.isDirectory && isImageUrl(f.url));
  const startIndex = images.findIndex((f) => f.url === clickedFile.url);
  if (startIndex === -1) return;

  // 如果 parent 还没 fetch 过，现在触发一次，sortedSiblingDirs 会自动更新
  if (!parentFetched()) fetchParent();

  const sizeMap = await preloadSizes(images, startIndex + 2);

  const dataSource: { src: string; width: number; height: number; alt: string }[] =
    images.map((img) => {
      const size = sizeMap.get(img.url);
      return { src: img.url, width: size?.w ?? 0, height: size?.h ?? 0, alt: img.name };
    });

  let loadingNext = false;
  const loadedDirs = new Set<string>([currentDirUrl]);

  async function appendNextDir(fromDirUrl: string) {
    const next = findNextDir(fromDirUrl); // 每次调用时实时读 store，排序变化自动生效
    if (!next || loadingNext || loadedDirs.has(next.url)) return;

    loadingNext = true;
    loadedDirs.add(next.url);

    const newImages = await fetchDirImages(next.url);

    if (!newImages.length || !lightbox?.pswp) {
      loadingNext = false;
      // 该目录无图片，跳过继续找下一个
      appendNextDir(next.url);
      return;
    }

    const sizes = await preloadSizes(newImages, 2);
    loadingNext = false;

    const insertStart = dataSource.length;
    newImages.forEach((img) => {
      const size = sizes.get(img.url);
      dataSource.push({ src: img.url, width: size?.w ?? 0, height: size?.h ?? 0, alt: img.name });
    });

    lightbox!.pswp!.refreshSlideContent(insertStart);
  }

  lightbox = new PhotoSwipeLightbox({
    dataSource,
    pswpModule: () => import("photoswipe"),
    wheelToZoom: true,
    bgOpacity: 0.9,
    padding: { top: 20, bottom: 20, left: 20, right: 20 },
    initialZoomLevel: (z) => Math.min(z.panAreaSize.x / z.elementSize.x, z.panAreaSize.y / z.elementSize.y),
    secondaryZoomLevel: 1,
    maxZoomLevel: 3,
  });

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

  // 用 lastDir 追踪当前图片所在目录，change 时实时更新
  let lastSrc: string = clickedFile.url;
  let lastDir: string = currentDirUrl;

  lightbox.on("change", () => {
    const pswp = lightbox?.pswp;
    if (!pswp) return;

    const currSrc = pswp.currSlide?.data?.src as string | undefined;
    if (currSrc) {
      lastSrc = currSrc;
      lastDir = dirOfImage(currSrc);
      window.history.replaceState(null, "", currSrc);
    }

    // 距末尾 3 张时预加载下一目录
    const remaining = dataSource.length - 1 - pswp.currIndex;
    if (remaining <= 3 && !loadingNext) appendNextDir(lastDir);
  });

  lightbox.on("close", () => {
    const targetDir = dirOfImage(lastSrc);
    window.history.replaceState(null, "", targetDir);
    setCurrentUrl(targetDir);
    fetchCurrent(targetDir);
    navigateDir(targetDir);
  });

  lightbox.loadAndOpen(startIndex);
}

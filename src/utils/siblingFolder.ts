// src/utils/siblingFolder.ts
import { fetchDirectory } from "../api/directory";
import { sortItems } from "./sort";
import { isImageUrl } from "./isImage";
import { type FileNode } from "./parser";

/** 获取目录的父目录 URL，根目录返回 null */
function getParentDirUrl(dirUrl: string): string | null {
  try {
    const url = new URL(dirUrl);
    if (url.pathname === "/" || url.pathname === "") return null;
    return new URL("../", url.href).href;
  } catch {
    return null;
  }
}

/** 规范化目录 URL 末尾的斜杠，便于做相等比较 */
function normalizeDirUrl(url: string): string {
  return url.endsWith("/") ? url : `${url}/`;
}

export interface SiblingDirs {
  /** 父目录下按 name 排序后的所有子目录 */
  dirs: FileNode[];
  /** 当前目录在 dirs 里的下标 */
  currentIndex: number;
}

/** 拉取父目录，定位当前目录的下标，构成可以循环遍历的"兄弟目录环" */
export async function getSiblingDirs(
  currentDirUrl: string,
): Promise<SiblingDirs | null> {
  const parentUrl = getParentDirUrl(currentDirUrl);
  if (!parentUrl) return null;

  let parentItems: FileNode[];
  try {
    ({ items: parentItems } = await fetchDirectory(parentUrl));
  } catch {
    return null;
  }

  const dirs = sortItems(parentItems, "name").filter((i) => i.isDirectory);
  const currentNorm = normalizeDirUrl(currentDirUrl);
  const currentIndex = dirs.findIndex(
    (d) => normalizeDirUrl(d.url) === currentNorm,
  );
  if (currentIndex === -1) return null;

  return { dirs, currentIndex };
}

export interface NextFolderMatch {
  /** 命中的目录在 dirs 里的下标 */
  index: number;
  images: FileNode[];
}

/**
 * 从 fromIndex 的下一个开始，沿环形顺序往后找第一个含图片的目录，
 * 绕回 stopIndex（不含）为止还没找到就返回 null。
 * 可以反复调用：每次传入上一次命中的 index 作为新的 fromIndex，
 * 就能一个一个地继续往后找，天然支持"翻多次"。
 */
export async function findNextNonEmptySibling(
  dirs: FileNode[],
  fromIndex: number,
  stopIndex: number,
): Promise<NextFolderMatch | null> {
  if (dirs.length === 0) return null;
  let i = (fromIndex + 1) % dirs.length;

  while (i !== stopIndex) {
    const candidate = dirs[i];
    try {
      const { items } = await fetchDirectory(candidate.url);
      const images = items.filter(
        (it) => !it.isDirectory && isImageUrl(it.url),
      );
      if (images.length > 0) {
        return { index: i, images };
      }
      // 该目录没有图片，跳过
    } catch {
      // 拉取失败，跳过
    }
    i = (i + 1) % dirs.length;
  }

  return null; // 已经绕回起点，所有兄弟目录都处理过了
}
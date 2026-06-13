// src/utils/parser.ts

export interface FileMetadata {
  date: string;
  size: string;
}

export interface FileNode {
  name: string;
  url: string;
  isDirectory: boolean;
  metadata?: FileMetadata;
  cover?: string; 
}

export interface ParseResult {
  title: string;
  items: FileNode[];
}

/**
 * 将 Nginx 返回的 HTML 转换为结构化的 JS 对象，包含文件元数据
 * @param htmlText Nginx 返回的原始 HTML 字符串
 * @param baseUrl 当前请求的 URL，用于拼接绝对路径
 * @returns 包含当前目录标题和文件列表的对象
 */
export function parseNginxHtml(htmlText: string, baseUrl: string = window.location.href): ParseResult {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlText, "text/html");

  const h1 = doc.querySelector("h1");
  const title = h1 ? h1.textContent || "目录" : "目录";

  const items: FileNode[] = [];
  const links = doc.querySelectorAll("pre a");

  links.forEach((link) => {
    const href = link.getAttribute("href");
    
    // 忽略空链接和上一级目录
    if (!href || href === "../" || href === "/") return;

    const isDirectory = href.endsWith("/");
    const absoluteUrl = new URL(href, baseUrl).href;

    // 🌟 安全的解码方式，防止 Nginx 截断的文件名或异常字符导致解析崩溃
    let name = href;
    try {
      name = decodeURIComponent(href).replace(/\/$/, "");
    } catch (e) {
      name = href.replace(/\/$/, "");
    }

    let metadata: FileMetadata | undefined = undefined;
    let cover: string | undefined = undefined;

    // 🌟 生成封面探测地址与解析元数据
    if (isDirectory) {
      cover = new URL("cover.jpg", absoluteUrl).href;
    } else {
      const nextNode = link.nextSibling;
      if (nextNode && nextNode.nodeType === 3) {
        const text = nextNode.textContent?.trim() || "";
        const match = text.match(/([\w\-]+\s+[\d:]+)\s+([\w\.\-]+)/);
        if (match) {
          metadata = { date: match[1], size: match[2] };
        } else {
          const parts = text.split(/\s+/);
          if (parts.length >= 3) {
            metadata = { date: `${parts[0]} ${parts[1]}`, size: parts[2] };
          }
        }
      }

      if (/\.(mp4|m3u8|mkv|avi)$/i.test(name)) {
        cover = absoluteUrl.replace(/\.[^/.]+$/, ".jpg");
      }
    }

    // 压入最终数组
    items.push({
      name,
      url: absoluteUrl,
      isDirectory,
      ...(metadata ? { metadata } : {}),
      ...(cover ? { cover } : {}),
    });
  });

  return { title, items };
}
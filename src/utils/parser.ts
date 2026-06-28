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
  cover?: string; // 保留可选字段，以防未来有些 API 自带封面下发
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

    // 🌟 解析元数据
    if (!isDirectory) {
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
    }

    // 压入最终数组
    items.push({
      name,
      url: absoluteUrl,
      isDirectory,
      ...(metadata ? { metadata } : {}),
    });
  });

  return { title, items };
}


// ── 拦截器集成 ────────────────────────────────────────────
export { applyInterceptors, registerInterceptor, unregisterInterceptor } from "./interceptors";

/** 解析 HTML + 依次执行所有已注册拦截器，返回最终 ParseResult */
export async function parseAndFilter(
  htmlText: string,
  dirUri: string
): Promise<ParseResult> {
  const { applyInterceptors } = await import("./interceptors");
  const raw = parseNginxHtml(htmlText, dirUri);
  return applyInterceptors(raw, dirUri);
}



export interface NginxJsonItem {
  name: string;
  type: "file" | "directory";
  mtime?: string;
  size?: number;
}

/**
 * 解析 autoindex JSON API
 *
 * API:
 * /api/Movies/
 *
 * 实际文件:
 * /Movies/
 */
export function parseNginxJson(
  jsonText: string,
  apiUrl: string = window.location.href
): ParseResult {
  const data = JSON.parse(jsonText) as NginxJsonItem[];

  // /api/... -> /...
  const baseUrl = apiUrl.replace(/\/api(?=\/|$)/, "");

  // 当前目录标题
  const pathname = new URL(baseUrl).pathname;
  const title =
    decodeURIComponent(pathname.replace(/\/$/, "").split("/").pop() || "/");

  const items: FileNode[] = data.map((item) => {
    const isDirectory = item.type === "directory";

    let url: string;

    if (isDirectory) {
      // 目录继续走 API
      url = new URL(
        `api/${encodeURIComponent(item.name)}/`,
        baseUrl.endsWith("/") ? baseUrl : baseUrl + "/"
      ).href;
    } else {
      // 文件走真实路径
      url = new URL(
        encodeURIComponent(item.name),
        baseUrl.endsWith("/") ? baseUrl : baseUrl + "/"
      ).href;
    }

    return {
      name: item.name,
      url,
      isDirectory,
      ...(item.mtime
        ? {
            metadata: {
              date: item.mtime,
              size: item.size != null ? String(item.size) : "",
            },
          }
        : {}),
    };
  });

  return { title, items };
}
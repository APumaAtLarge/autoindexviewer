// src/api/directory.ts
import { parseAndFilter, type ParseResult } from "../utils/parser";

/**
 * 抓取并解析 Nginx 目录页面
 * @param targetUrl 目标目录的完整 URL
 * @returns 解析后的完整结果（包含 title 和过滤后的 items）
 */
export async function fetchDirectory(targetUrl: string): Promise<ParseResult> {
  const response = await fetch(targetUrl);
  
  if (!response.ok) {
    throw new Error(`请求失败: ${response.status}`);
  }
  
  const html = await response.text();
  return await parseAndFilter(html, targetUrl);
}
// src/utils/interceptors.ts
import type { ParseResult, FileNode } from "./parser";

/**
 * 拦截器接口：接收解析结果 + 当前目录 URI，返回处理后的结果
 * 每个拦截器可以异步执行（如查 IndexedDB）
 */
export interface Interceptor {
  name: string;
  apply(result: ParseResult, dirUri: string): Promise<ParseResult>;
}

/** 全局拦截器注册表，按顺序执行 */
const interceptors: Interceptor[] = [];

export function registerInterceptor(interceptor: Interceptor): void {
  interceptors.push(interceptor);
}

export function unregisterInterceptor(name: string): void {
  const idx = interceptors.findIndex((i) => i.name === name);
  if (idx !== -1) interceptors.splice(idx, 1);
}

/**
 * 对 ParseResult 依次应用所有已注册的拦截器
 * 在 parseNginxHtml 之后、渲染之前调用
 */
export async function applyInterceptors(
  result: ParseResult,
  dirUri: string
): Promise<ParseResult> {
  let current = result;
  for (const interceptor of interceptors) {
    try {
      current = await interceptor.apply(current, dirUri);
    } catch (err) {
      console.warn(`[Interceptor:${interceptor.name}] 执行失败，已跳过:`, err);
    }
  }
  return current;
}
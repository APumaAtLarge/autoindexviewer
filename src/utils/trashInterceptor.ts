// src/utils/trashInterceptor.ts
import type { Interceptor } from "./interceptors";
import { getTrashedUrls } from "../db";

export const trashInterceptor: Interceptor = {
  name: "trash",

  async apply(result, dirUri) {
    const trashedSet = await getTrashedUrls(dirUri);
    if (trashedSet.size === 0) return result; // 快路径：没有删除记录

    return {
      ...result,
      items: result.items.filter((item) => !trashedSet.has(item.url)),
    };
  },
};
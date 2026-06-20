// src/api/trash.ts
import { trashFile, restoreFile, getTrashedUrls } from "../db/trash";

/** * API: 将文件移入垃圾桶（软删除）
 */
export async function apiDeleteFile(
  dirUri: string,
  fileUrl: string,
  fileName: string
): Promise<void> {
  await trashFile(dirUri, fileUrl, fileName);
}

/** * API: 从垃圾桶还原文件
 */
export async function apiRestoreFile(fileUrl: string): Promise<void> {
  await restoreFile(fileUrl);
}

/** * API: 获取指定目录下所有已被删除的 URL 集合
 */
export async function apiGetTrashedUrls(dirUri: string): Promise<Set<string>> {
  return await getTrashedUrls(dirUri);
}

import { getAllTrashRecords } from "../db/trash";

/** * API: 获取所有的垃圾桶记录
 */
export async function apiGetAllTrashRecords() {
  return await getAllTrashRecords();
}
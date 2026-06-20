
// src/db.ts
import Dexie, { type Table } from "dexie";

export interface TrashRecord {
  id?:        number;   // 自增主键
  dirUri:     string;   // 所在文件夹 URI（e.g. "https://host/movies/"）
  fileUrl:    string;   // 文件/子目录完整 URL（唯一业务键）
  fileName:   string;   // 显示名，方便查询
  deletedAt:  number;   // Date.now() 时间戳
}

class VidViewerDB extends Dexie {
  trash!: Table<TrashRecord, number>;

  constructor() {
    super("VidViewerDB");
    this.version(1).stores({
      // id 自增，fileUrl 加唯一索引，dirUri + deletedAt 用于查询
      trash: "++id, &fileUrl, dirUri, deletedAt",
    });
  }
}

export const db = new VidViewerDB();

// ── 工具函数 ──────────────────────────────────────────────

/** 软删除一个文件/目录 */
export async function trashFile(
  dirUri: string,
  fileUrl: string,
  fileName: string
): Promise<void> {
  // put 覆盖写：重复删同一个文件只保留最新记录
  await db.trash.put({ dirUri, fileUrl, fileName, deletedAt: Date.now() });
}

/** 还原（从垃圾桶移除） */
export async function restoreFile(fileUrl: string): Promise<void> {
  await db.trash.where("fileUrl").equals(fileUrl).delete();
}

/** 获取某目录下所有被删除的 URL 集合（用于前端过滤） */
export async function getTrashedUrls(dirUri: string): Promise<Set<string>> {
  const records = await db.trash.where("dirUri").equals(dirUri).toArray();
  return new Set(records.map((r) => r.fileUrl));
}

/** 获取所有被删除的记录（按删除时间倒序，用于主页展示） */
export async function getAllTrashRecords(): Promise<TrashRecord[]> {
  return await db.trash.orderBy("deletedAt").reverse().toArray();
}
// src/utils/sort.ts
import type { FileNode } from "./parser";

export type SortMode = "name" | "date" | "random";

/**
 * 解析 Nginx 目录页中的日期字符串为 Date 对象
 * 支持格式：
 *   "06-May-2026 08:57"
 *   "2026-05-06 08:57"
 */
const MONTH_MAP: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

function parseDate(dateStr: string): number {
  if (!dateStr) return 0;

  // "06-May-2026 08:57"
  const ddMonYYYY = dateStr.match(
    /^(\d{2})-([A-Za-z]{3})-(\d{4})\s+(\d{2}):(\d{2})$/
  );
  if (ddMonYYYY) {
    const [, dd, mon, yyyy, hh, mm] = ddMonYYYY;
    const month = MONTH_MAP[mon];
    if (month !== undefined) {
      return new Date(
        Number(yyyy), month, Number(dd), Number(hh), Number(mm)
      ).getTime();
    }
  }

  // ISO 風 "2026-05-06 08:57"
  const iso = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})$/);
  if (iso) {
    const [, yyyy, mm2, dd2, hh, min] = iso;
    return new Date(
      Number(yyyy), Number(mm2) - 1, Number(dd2), Number(hh), Number(min)
    ).getTime();
  }

  return 0;
}

/**
 * 对 FileNode 数组排序，目录永远排在文件前面。
 */
export function sortItems(items: FileNode[], mode: SortMode): FileNode[] {
  const dirs  = items.filter((i) => i.isDirectory);
  const files = items.filter((i) => !i.isDirectory);

  const sortGroup = (group: FileNode[]): FileNode[] => {
    const copy = [...group];
    switch (mode) {
      case "name":
        copy.sort((a, b) =>
          a.name.localeCompare(b.name, undefined, {
            numeric: true,
            sensitivity: "base",
          })
        );
        break;
      case "date":
        copy.sort((a, b) => {
          const ta = parseDate(a.metadata?.date ?? "");
          const tb = parseDate(b.metadata?.date ?? "");
          // 降序（最新在前）；没有日期的排最后
          if (ta === 0 && tb === 0) return 0;
          if (ta === 0) return 1;
          if (tb === 0) return -1;
          return tb - ta;
        });
        break;
      case "random":
        // Fisher-Yates shuffle
        for (let i = copy.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        break;
    }
    return copy;
  };

  return [...sortGroup(dirs), ...sortGroup(files)];
}

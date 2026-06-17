
import { fetchDirectory } from "./api/directory";
import { setPlaylist, playlist } from "./store/playlist";
// src/player.ts
// 全局单例 XGPlayer 实例管理器

import Player, { Events } from "xgplayer";
import HlsPlugin from "xgplayer-hls";
import "xgplayer/dist/index.min.css";
import { setIsMuted, isMuted } from "./store/muted";
import { videoUrl, setVideoUrl, isHls } from "./store/urlParams";
import { _applyMuted } from "./player";
/** 切换静音状态，同时同步到播放器实例和 store */
export function toggleMute() {
    setIsMuted(!isMuted());
    _applyMuted();
}

/** 将视频追加到播放列表（已存在则跳过） */
export function addToPlaylist(url: string, name?: string) {
    const current = playlist();
    if (current.some((item) => item.url === url)) return;
    setPlaylist([...current, { url, name: name ?? url.split("/").pop() ?? url }]);
}
/** 从播放列表移除 */
export function removeFromPlaylist(url: string) {
    setPlaylist(playlist().filter((item) => item.url !== url));
}
import type { PlaylistItem } from "./store/playlist";
/**
 * 将指定目录下的所有视频文件追加到播放列表（已存在的跳过）。
 * 用于「导入文件夹」工具栏按钮。
 * @param dirUrl 目录 URL（如 currentUrl）
 * @returns 实际新增的条目数
 */
export async function addFolderToPlaylist(dirUrl: string): Promise<number> {
    const VIDEO_RE = /\.(mp4|m3u8|mkv|avi|mov|webm)(\?|#|$)/i;
    const { items } = await fetchDirectory(dirUrl);
    const existing = new Set(playlist().map((i) => i.url));

    const newItems: PlaylistItem[] = items
        .filter((item) => !item.isDirectory && VIDEO_RE.test(item.url))
        .filter((item) => !existing.has(item.url))
        .map((item) => ({ url: item.url, name: item.name }));

    if (newItems.length > 0) {
        setPlaylist([...playlist(), ...newItems]);
    }
    return newItems.length;
}
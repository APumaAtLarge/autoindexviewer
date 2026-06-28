
// src/components/sidebar/PlaylistView.tsx
import { createSignal, For, Show } from "solid-js";
import { playlist, setPlaylist } from "../../store/playlist";
import { playMode, setPlayMode, type PlayMode } from "../../store/playMode";
import { videoUrl, setVideoUrl } from "../../store/urlParams";
import { currentUrl } from "../../store/urlPath"; // ✨ 修改：引入统一的 urlPath 状态源
import { addFolderToPlaylist, removeFromPlaylist } from "../../playlist";
import toast from "../../ui/toast";
import './PlaylistView.scss'

const PLAY_MODE_OPTIONS: { mode: PlayMode; icon: string; title: string }[] = [
  { mode: "normal", icon: "➡️", title: "顺序播放" },
  { mode: "list", icon: "🔁", title: "列表循环" },
  { mode: "single", icon: "🔂", title: "单曲循环" },
  { mode: "shuffle", icon: "🔀", title: "随机播放" },
];

interface PlaylistViewProps {
  isMobile: boolean;
  setIsOpen: (open: boolean) => void;
}

export const PlaylistView = (props: PlaylistViewProps) => {
  const [folderLoading, setFolderLoading] = createSignal(false);

  const handleAddFolder = async () => {
    setFolderLoading(true);
    try {
      // 使用统一的全局当前路径 currentUrl()
      const count = await addFolderToPlaylist(currentUrl());
      if (count > 0) {
        toast.success(`已添加 ${count} 个视频到播放列表`);
      } else {
        toast.success("当前文件夹内的视频已全部在列表中");
      }
    } catch (err: any) {
      toast.error("读取文件夹失败：" + (err.message ?? "未知错误"));
    } finally {
      setFolderLoading(false);
    }
  };

  const handleClearPlaylist = () => {
    setPlaylist([]);
    toast.success("播放列表已清空");
  };

  return (
    <>
      <div class="playlist-toolbar">
        {/* 左侧：操作按钮 */}
        <div class="toolbar-actions">
          <button
            class="toolbar-btn"
            title={folderLoading() ? "正在导入..." : "导入当前文件夹的视频"}
            disabled={folderLoading()}
            onClick={handleAddFolder}
          >
            <span class="toolbar-btn-icon">
              {folderLoading() ? "⏳" : "📥"}
            </span>
            <span class="toolbar-btn-label">导入文件夹</span>
          </button>

          <Show when={playlist().length > 0}>
            <button
              class="toolbar-btn toolbar-btn--danger"
              title="清空播放列表"
              onClick={handleClearPlaylist}
            >
              <span class="toolbar-btn-icon">🗑️</span>
              <span class="toolbar-btn-label">清空</span>
            </button>
          </Show>
        </div>

        {/* 右侧：播放模式切换 */}
        <div class="mode-group">
          <For each={PLAY_MODE_OPTIONS}>
            {(opt) => (
              <button
                classList={{
                  "mode-btn": true,
                  active: playMode() === opt.mode,
                }}
                title={opt.title}
                onClick={() => setPlayMode(opt.mode)}
              >
                {opt.icon}
              </button>
            )}
          </For>
        </div>
      </div>

      <Show
        when={playlist().length > 0}
        fallback={
          <div class="status empty">
            <span class="empty-icon">🎵</span>
            <span>列表为空，点击「导入文件夹」添加视频</span>
          </div>
        }
      >
        <ul class="list playlist-list">
          <For each={playlist()}>
            {(item, idx) => (
              <li
                classList={{
                  item: true,
                  file: true,
                  active: videoUrl() === item.url,
                }}
                title={item.name}
                onClick={() => {
                  setVideoUrl(item.url);
                  if (props.isMobile) props.setIsOpen(false);
                }}
              >
                <span class="playlist-index">{idx() + 1}</span>
                
                <span class="name">
                  {item.name}
                </span>
                
                <button
                  class="playlist-remove"
                  title="从列表移除"
                  onClick={(e) => {
                    e.stopPropagation(); // 阻止事件冒泡到整行 li
                    removeFromPlaylist(item.url);
                  }}
                >
                  ✕
                </button>
              </li>
            )}
          </For>
        </ul>
      </Show>
    </>
  );
};
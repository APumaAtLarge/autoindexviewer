
// src/Sidebar.tsx
import { onMount, Show } from "solid-js";
import { type FileNode } from "./utils/parser";
import { videoUrl, setVideoUrl } from "./store/urlParams";
import { navigateDir } from "./store/browseDir";
import { sortItems } from "./utils/sort";
import "./Sidebar.scss";

// 引入拆分的子组件
import { SidebarTabBar } from "./components/sidebar/SidebarTabBar";
import { SidebarSortBar } from "./components/sidebar/SidebarSortBar";
import { DirectoryList } from "./components/sidebar/DirectoryList";
import { PlaylistView } from "./components/sidebar/PlaylistView";

// 引入统一的状态库
import { activeTab, setActiveTab, sortMode, isPinned } from "./store/sidebarUI";
import {
  currentUrl, setCurrentUrl, fetchCurrent, fetchParent,
  currentItems, currentLoading, currentError,
  parentItems, parentLoading, parentError, setParentItems, setParentFetched
} from "./store/directory";

interface SidebarProps {
  isOpen: () => boolean;
  isMobile: () => boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar = (props: SidebarProps) => {
  onMount(() => fetchCurrent(currentUrl()));

  const isVideoFile = (url: string) =>
    /\.(mp4|m3u8|mkv|avi|mov|webm)$/i.test(url);

  const handleItemClick = (item: FileNode) => {
    if (props.isMobile()) props.setIsOpen(false);

    if (item.isDirectory) {
      window.history.pushState(null, "", item.url);
      navigateDir(item.url);
      setCurrentUrl(item.url);
      setParentFetched(false);
      setParentItems([]);
      fetchCurrent(item.url);

      // 根据缓存的 Pin 状态决定是否跳转 Tab
      if (isPinned()) {
        if (activeTab() === "parent") fetchParent();
      } else {
        setActiveTab("current");
      }
    } else if (isVideoFile(item.url)) {
      setVideoUrl(item.url);
      window.history.pushState(null, "", item.url);
    } else {
      window.location.href = item.url;
    }
  };

  const sortedCurrent = () => sortItems(currentItems(), sortMode());
  const sortedParent = () => sortItems(parentItems(), sortMode());

  return (
    <>
      <div classList={{ Sidebar: true, open: props.isOpen() }}>
        {/* 0 Props, 干净利落 */}
        <SidebarTabBar />

        <Show when={activeTab() !== "playlist"}>
          {/* 0 Props, 干净利落 */}
          <SidebarSortBar />
        </Show>

        <Show when={activeTab() === "current"}>
          <DirectoryList
            items={sortedCurrent()}
            loading={currentLoading()}
            error={currentError()}
            currentUrl={currentUrl()}
            onItemClick={handleItemClick}
          />
        </Show>

        <Show when={activeTab() === "parent"}>
          <DirectoryList
            items={sortedParent()}
            loading={parentLoading()}
            error={parentError()}
            currentUrl={currentUrl()}
            onItemClick={handleItemClick}
          />
        </Show>

        <Show when={activeTab() === "playlist"}>
          <PlaylistView
            isMobile={props.isMobile()}
            setIsOpen={props.setIsOpen}
          />
        </Show>
      </div>

      <div class="sidebar-mask" onClick={() => props.setIsOpen(false)} />
    </>
  );
};
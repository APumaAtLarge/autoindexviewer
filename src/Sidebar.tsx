// src/Sidebar.tsx
import { onMount, Show } from "solid-js";
import { type FileNode } from "./utils/parser";
import { videoUrl, setVideoUrl } from "./store/urlParams";
import { navigateToDir, currentUrl } from "./store/urlPath"; // 👈 引入新网关
import "./Sidebar.scss";

import { SidebarTabBar } from "./components/sidebar/SidebarTabBar";
import { SidebarSortBar } from "./components/sidebar/SidebarSortBar";
import { DirectoryList } from "./components/sidebar/DirectoryList";
import { PlaylistView } from "./components/sidebar/PlaylistView";

import { activeTab, setActiveTab, isPinned } from "./store/sidebarUI";
import {
  fetchCurrent,
  sortedCurrentItems,
  sortedParentItems,
  currentLoading,
  currentError,
  parentLoading,
  parentError,
  setParentItems,
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
      // ✨ 职责分离：点击后只负责更新 URL 触发流
      navigateToDir(item.url);

      if (!isPinned()) {
        setActiveTab("current");
        setParentItems([]);
      }
    } else if (isVideoFile(item.url)) {
      setVideoUrl(item.url);
      window.history.pushState(null, "", item.url);
    } else {
      window.location.href = item.url;
    }
  };

  return (
    <>
      <div classList={{ Sidebar: true, open: props.isOpen() }}>
        <SidebarTabBar />

        <Show when={activeTab() !== "playlist"}>
          <SidebarSortBar />
        </Show>

        <Show when={activeTab() === "current"}>
          <DirectoryList
            items={sortedCurrentItems()}
            loading={currentLoading()}
            error={currentError()}
            currentUrl={currentUrl()}
            onItemClick={handleItemClick}
          />
        </Show>

        <Show when={activeTab() === "parent"}>
          <DirectoryList
            items={sortedParentItems()}
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
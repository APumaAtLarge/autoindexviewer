// src/Sidebar.tsx
import { createSignal, onMount, Show } from "solid-js";
import { type FileNode } from "./utils/parser";
import { videoUrl, setVideoUrl } from "./store/urlParams";
import { navigateDir } from "./store/browseDir";
import { fetchDirectory } from "./api/directory";
import { sortItems, type SortMode } from "./utils/sort";
import "./Sidebar.scss";

// 引入拆分的子组件
import {
  SidebarTabBar,
  type TabId,
  type TabOption,
} from "./components/SidebarTabBar";
import { SidebarSortBar } from "./components/SidebarSortBar";
import { DirectoryList } from "./components/DirectoryList";
import { PlaylistView } from "./components/PlaylistView";

// interface SidebarProps {
//   isOpen: boolean;
//   isMobile: boolean;
//   setIsOpen: (open: boolean) => void;
// }

interface SidebarProps {
isOpen: () => boolean;
isMobile: () => boolean;
setIsOpen: (open: boolean) => void;
}

export const Sidebar = (props: SidebarProps) => {
  const [activeTab, setActiveTab] = createSignal<TabId>("current");
  const [sortMode, setSortMode] = createSignal<SortMode>("name");

  const [currentUrl, setCurrentUrl] = createSignal<string>(
    new URL(".", window.location.href).href,
  );

  const parentUrl = () => {
    const url = new URL(currentUrl());
    if (url.pathname === "/" || url.pathname === "") return null;
    return new URL("../", url.href).href;
  };

  const [currentItems, setCurrentItems] = createSignal<FileNode[]>([]);
  const [currentLoading, setCurrentLoading] = createSignal<boolean>(true);
  const [currentError, setCurrentError] = createSignal<string | null>(null);

  const [parentItems, setParentItems] = createSignal<FileNode[]>([]);
  const [parentLoading, setParentLoading] = createSignal<boolean>(false);
  const [parentError, setParentError] = createSignal<string | null>(null);
  const [parentFetched, setParentFetched] = createSignal<boolean>(false);

  const fetchItems = async (
    targetUrl: string,
    setLoading: (v: boolean) => void,
    setError: (v: string | null) => void,
    setItems: (v: FileNode[]) => void,
  ) => {
    setLoading(true);
    setError(null);
    try {
      const { items } = await fetchDirectory(targetUrl);
      setItems(items);
    } catch (err: any) {
      setError(err.message || "未知错误");
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrent = (url: string) =>
    fetchItems(url, setCurrentLoading, setCurrentError, setCurrentItems);

  const fetchParent = () => {
    const p = parentUrl();
    if (!p) return;
    setParentFetched(true);
    fetchItems(p, setParentLoading, setParentError, setParentItems);
  };

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
      setActiveTab("current");
    } else if (isVideoFile(item.url)) {
      setVideoUrl(item.url);
      window.history.pushState(null, "", item.url);
    } else {
      window.location.href = item.url;
    }
  };

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    if (tab === "parent" && !parentFetched()) fetchParent();
  };

  const dirName = (url: string) => {
    const path = new URL(url).pathname.replace(/\/$/, "");
    const parts = path.split("/").filter(Boolean);
    return parts.length > 0 ? parts[parts.length - 1] : "/";
  };

  const tabs: TabOption[] = [
    { id: "current", label: () => dirName(currentUrl()), icon: "📂" },
    {
      id: "parent",
      label: () => (parentUrl() ? dirName(parentUrl()!) : "上级目录"),
      icon: "⬆️",
      disabled: () => !parentUrl(),
    },
    { id: "playlist", label: () => "播放列表", icon: "▶️" },
  ];

  const sortedCurrent = () => sortItems(currentItems(), sortMode());
  const sortedParent = () => sortItems(parentItems(), sortMode());

  return (
    <>
      <div classList={{ Sidebar: true, open: props.isOpen() }}>
        <SidebarTabBar
          tabs={tabs}
          activeTab={activeTab()}
          onTabChange={handleTabChange}
        />

        <Show when={activeTab() !== "playlist"}>
          <SidebarSortBar sortMode={sortMode()} setSortMode={setSortMode} />
        </Show>

        <Show when={activeTab() === "current"}>
          <DirectoryList
            items={sortedCurrent()}
            loading={currentLoading()}
            error={currentError()}
            currentUrl={currentUrl()}
            videoUrl={videoUrl()}
            onItemClick={handleItemClick}
          />
        </Show>

        <Show when={activeTab() === "parent"}>
          <DirectoryList
            items={sortedParent()}
            loading={parentLoading()}
            error={parentError()}
            currentUrl={currentUrl()}
            videoUrl={videoUrl()}
            onItemClick={handleItemClick}
          />
        </Show>

        <Show when={activeTab() === "playlist"}>
          <PlaylistView
            currentUrl={currentUrl()}
            isMobile={props.isMobile()}
            setIsOpen={props.setIsOpen}
          />
        </Show>
      </div>

      <div class="sidebar-mask" onClick={() => props.setIsOpen(false)} />
    </>
  );
};

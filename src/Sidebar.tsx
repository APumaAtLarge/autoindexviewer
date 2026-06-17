// src/Sidebar.tsx
import { createSignal, onMount, For, Show } from "solid-js";
import { parseAndFilter, parseNginxHtml, type FileNode } from "./utils/parser";
// import { videoUrl, setVideoUrl, setIsHls, setBrowseDir } from "./store";
// 只改 import 和 handleItemClick 里的一行
import { videoUrl, setVideoUrl, setIsHls, navigateDir } from "./store";
import { fetchDirectory } from "./api/directory"; // ← 引入新的 API 函数
import { sortItems, type SortMode } from "./utils/sort";
import "./Sidebar.scss";

interface SidebarProps {
  isOpen: boolean;
  isMobile: boolean;
  setIsOpen: (open: boolean) => void;
}

type TabId = "current" | "parent" | "playlist";

const SORT_OPTIONS: { mode: SortMode; label: string }[] = [
  { mode: "name", label: "名称" },
  { mode: "date", label: "时间" },
  { mode: "random", label: "随机" },
];

export const Sidebar = (props: SidebarProps) => {
  const [activeTab, setActiveTab] = createSignal<TabId>("current");
  const [sortMode, setSortMode] = createSignal<SortMode>("name");

  // currentUrl：用户"当前所在"目录，不随 tab 切换改变
  const [currentUrl, setCurrentUrl] = createSignal<string>(
    new URL(".", window.location.href).href,
  );

  // 父目录 URL，始终从 currentUrl 派生
  const parentUrl = () => {
    const url = new URL(currentUrl());
    if (url.pathname === "/" || url.pathname === "") return null;
    return new URL("../", url.href).href;
  };

  // 两套独立状态
  const [currentItems, setCurrentItems] = createSignal<FileNode[]>([]);
  const [currentLoading, setCurrentLoading] = createSignal<boolean>(true);
  const [currentError, setCurrentError] = createSignal<string | null>(null);

  const [parentItems, setParentItems] = createSignal<FileNode[]>([]);
  const [parentLoading, setParentLoading] = createSignal<boolean>(false);
  const [parentError, setParentError] = createSignal<string | null>(null);
  const [parentFetched, setParentFetched] = createSignal<boolean>(false);

  // 通用 fetch (重构后变得非常清爽)
  const fetchItems = async (
    targetUrl: string,
    setLoading: (v: boolean) => void,
    setError: (v: string | null) => void,
    setItems: (v: FileNode[]) => void,
  ) => {
    setLoading(true);
    setError(null);
    try {
      // ✅ 直接调用抽象好的 API 层
      const { items } = await fetchDirectory(targetUrl);
      setItems(items);
    } catch (err: any) {
      setError(err.message || "未知错误");
    } finally {
      setLoading(false);
    }
  };
  // 通用 fetch
  // const fetchItems = async (
  //   targetUrl: string,
  //   setLoading: (v: boolean) => void,
  //   setError:   (v: string | null) => void,
  //   setItems:   (v: FileNode[]) => void
  // ) => {
  //   setLoading(true);
  //   setError(null);
  //   try {
  //     const response = await fetch(targetUrl);
  //     if (!response.ok) throw new Error(`请求失败: ${response.status}`);
  //     const html = await response.text();
  //     // setItems(parseNginxHtml(html, targetUrl).items);
  //      setItems((await parseAndFilter(html, targetUrl)).items); // ← 换这里
  //   } catch (err: any) {
  //     setError(err.message || "未知错误");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

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
    if (props.isMobile) props.setIsOpen(false);

    if (item.isDirectory) {
      // window.history.pushState(null, "", item.url);
      // setBrowseDir(item.url);
      // setCurrentUrl(item.url);
      // setParentFetched(false);
      // setParentItems([]);
      // fetchCurrent(item.url);
      // setActiveTab("current");
      window.history.pushState(null, "", item.url);
      navigateDir(item.url); // ← 原来是 setBrowseDir(item.url)
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

  const currentDirName = () => dirName(currentUrl());
  const parentDirName = () => {
    const p = parentUrl();
    return p ? dirName(p) : null;
  };

  const tabs: {
    id: TabId;
    label: () => string;
    icon: string;
    disabled?: () => boolean;
  }[] = [
    { id: "current", label: currentDirName, icon: "📂" },
    {
      id: "parent",
      label: () => parentDirName() ?? "上级目录",
      icon: "⬆️",
      disabled: () => !parentUrl(),
    },
    { id: "playlist", label: () => "播放列表", icon: "▶️" },
  ];

  // 排序后的列表（派生计算）
  const sortedCurrent = () => sortItems(currentItems(), sortMode());
  const sortedParent = () => sortItems(parentItems(), sortMode());

  const renderList = (
    items: FileNode[],
    loading: boolean,
    error: string | null,
  ) => (
    <>
      <Show when={loading}>
        <div class="status">正在载入目录...</div>
      </Show>
      <Show when={!!error}>
        <div class="status error">❌ {error}</div>
      </Show>
      <Show when={!loading && !error}>
        <ul class="list">
          <For each={items}>
            {(item) => (
              <li
                classList={{
                  item: true,
                  dir: item.isDirectory,
                  file: !item.isDirectory,
                  active: item.isDirectory
                    ? currentUrl() === item.url
                    : videoUrl() === item.url,
                }}
                onClick={() => handleItemClick(item)}
                title={item.name}
              >
                <span class="icon">{item.isDirectory ? "📁" : "🎬"}</span>
                <span class="name">{item.name}</span>
              </li>
            )}
          </For>
        </ul>
      </Show>
    </>
  );

  return (
    <>
      <div classList={{ Sidebar: true, open: props.isOpen }}>
        {/* ── 上方：目录 Tab Bar ── */}
        <div class="tab-bar">
          <For each={tabs}>
            {(tab) => (
              <button
                classList={{
                  tab: true,
                  active: activeTab() === tab.id,
                  disabled: tab.disabled?.() ?? false,
                }}
                onClick={() => !tab.disabled?.() && handleTabChange(tab.id)}
                title={tab.label()}
              >
                <span class="tab-icon">{tab.icon}</span>
                <span class="tab-label">{tab.label()}</span>
              </button>
            )}
          </For>
        </div>

        {/* ── 下方：排序 Bar（仅目录类 tab 显示） ── */}
        <Show when={activeTab() !== "playlist"}>
          <div class="sort-bar">
            <span class="sort-label">排序</span>
            <For each={SORT_OPTIONS}>
              {(opt) => (
                <button
                  classList={{
                    "sort-btn": true,
                    active: sortMode() === opt.mode,
                  }}
                  onClick={() => setSortMode(opt.mode)}
                >
                  {opt.label}
                </button>
              )}
            </For>
          </div>
        </Show>

        {/* ── 内容区 ── */}
        <Show when={activeTab() === "current"}>
          {renderList(sortedCurrent(), currentLoading(), currentError())}
        </Show>

        <Show when={activeTab() === "parent"}>
          {renderList(sortedParent(), parentLoading(), parentError())}
        </Show>

        <Show when={activeTab() === "playlist"}>
          <div class="status empty">
            <span class="empty-icon">🎵</span>
            <span>播放列表暂未实现</span>
          </div>
        </Show>
      </div>

      <div class="sidebar-mask" onClick={() => props.setIsOpen(false)} />
    </>
  );
};

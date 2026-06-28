// src/components/sidebar/SidebarTabBar.tsx
import { For } from "solid-js";
import { activeTab, setActiveTab, type TabId } from "../../store/sidebarUI";
import { parentFetched, fetchParent } from "../../store/directory";
import { currentUrl, parentUrl } from "../../store/urlPath"; // ✨ 统一从 urlPath 导入
import "./SidebarTabBar.scss";

interface TabOption {
  id: TabId;
  label: () => string;
  icon: string;
  disabled?: () => boolean;
}

export const SidebarTabBar = () => {
  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    if (tab === "parent" && !parentFetched()) fetchParent();
  };

  const dirName = (url: string) => {
    try {
      const path = new URL(url).pathname.replace(/\/$/, "");
      const parts = path.split("/").filter(Boolean);
      return parts.length > 0 ? parts[parts.length - 1] : "/";
    } catch {
      return "/";
    }
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

  return (
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
  );
};
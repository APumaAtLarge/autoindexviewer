// src/components/SidebarTabBar.tsx
import { For } from "solid-js";

export type TabId = "current" | "parent" | "playlist";

export interface TabOption {
  id: TabId;
  label: () => string;
  icon: string;
  disabled?: () => boolean;
}

interface SidebarTabBarProps {
  tabs: TabOption[];
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export const SidebarTabBar = (props: SidebarTabBarProps) => {
  return (
    <div class="tab-bar">
      <For each={props.tabs}>
        {(tab) => (
          <button
            classList={{
              tab: true,
              active: props.activeTab === tab.id,
              disabled: tab.disabled?.() ?? false,
            }}
            onClick={() => !tab.disabled?.() && props.onTabChange(tab.id)}
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
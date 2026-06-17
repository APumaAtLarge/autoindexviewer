// src/components/DirectoryList.tsx
import { For, Show } from "solid-js";
import type { FileNode } from "../utils/parser";

interface DirectoryListProps {
  items: FileNode[];
  loading: boolean;
  error: string | null;
  currentUrl: string;
  videoUrl: string;
  onItemClick: (item: FileNode) => void;
}

export const DirectoryList = (props: DirectoryListProps) => {
  return (
    <>
      <Show when={props.loading}>
        <div class="status">正在载入目录...</div>
      </Show>
      
      <Show when={!!props.error}>
        <div class="status error">❌ {props.error}</div>
      </Show>
      
      <Show when={!props.loading && !props.error}>
        <ul class="list">
          <For each={props.items}>
            {(item) => (
              <li
                classList={{
                  item: true,
                  dir: item.isDirectory,
                  file: !item.isDirectory,
                  active: item.isDirectory
                    ? props.currentUrl === item.url
                    : props.videoUrl === item.url,
                }}
                onClick={() => props.onItemClick(item)}
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
};
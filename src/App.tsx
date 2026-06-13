// src/App.tsx
import { Sidebar } from "./Sidebar";
import { VideoPlayer } from "./VideoPlayer";
import { DirectoryView } from "./DirectoryView"; // 🌟 引入新组件
import { videoUrl } from "./store";
import { Show } from "solid-js";
import "./style.css";

export function App() {
  return (
    <>
      {/* 侧边栏始终存在 */}
      <Sidebar />

      {/* 主体内容区域：有视频就渲染 Player，没有就渲染目录 */}
      <div id="app">
        <Show 
          when={videoUrl() !== ""} 
          fallback={<DirectoryView />}
        >
          <VideoPlayer />
        </Show>
      </div>
    </>
  );
}
// src/App.tsx
import { Show } from "solid-js";
import { Layout } from "./Layout";
import { Sidebar } from "./Sidebar";
import { VideoPlayer } from "./VideoPlayer";
import { DirectoryView } from "./DirectoryView";
import { videoUrl } from "./store";
import "./style.css";

export function App() {
  return (
    <Layout
      // 🌟 接收三个参数，当场组装 Sidebar，依然保持绝对的解耦！
      sidebar={(isOpen, setIsOpen, isMobile) => (
        <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} isMobile={isMobile} />
      )}
    >
      <Show 
        when={videoUrl() !== ""} 
        fallback={<DirectoryView />}
      >
        <VideoPlayer />
      </Show>
    </Layout>
  );
}
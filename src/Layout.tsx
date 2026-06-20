// src/Layout.tsx
import { createSignal, onMount, onCleanup, Show, type JSX } from "solid-js";
import { isHomeOpen, openHome, closeHome } from "./store/homeView";
import { Home } from "./Home";
import "./Layout.scss";

interface LayoutProps {
  sidebar: (
    isOpen: () => boolean,
    setIsOpen: (open: boolean) => void,
    isMobile: () => boolean,
  ) => JSX.Element;
  children: JSX.Element;
}

export const Layout = (props: LayoutProps) => {
  const [isMobile, setIsMobile] = createSignal(window.innerWidth <= 768);
  const [isOpen, setIsOpen] = createSignal(window.innerWidth > 768);

  const handleResize = () => {
    const mobile = window.innerWidth <= 768;
    setIsMobile(mobile);
    if (!mobile) setIsOpen(true);
  };

  onMount(() => window.addEventListener("resize", handleResize));
  onCleanup(() => window.removeEventListener("resize", handleResize));

  const toggleHome = () => (isHomeOpen() ? closeHome() : openHome());

  return (
    <div class="app-layout" classList={{ "home-active": isHomeOpen() }}>
      <header class="app-header">
        <Show when={!isHomeOpen()}>
          <button class="sidebar-toggle-btn" onClick={() => setIsOpen(!isOpen())}>
            {isOpen() ? "✕ 关闭" : "☰ 目录"}
          </button>
          <a
            href={(() => {
              const p = window.location.pathname.replace(/\/$/, "");
              return p.includes("/") ? p.slice(0, p.lastIndexOf("/")) + "/" : "/";
            })()}
            class="header-back-btn"
            title="返回上一级"
          >
            ← 上级
          </a>
        </Show>

        <div class="header-title">🎬 VidViewer</div>

        {/* 🌟 新增：主页入口/退出，靠右对齐 */}
        <button
          class="home-toggle-btn"
          onClick={toggleHome}
          title={isHomeOpen() ? "返回" : "主页"}
        >
          {isHomeOpen() ? "✕ 退出" : "🏠"}
        </button>
      </header>

      <div class="layout-body">
        {/* Sidebar 始终挂载，仅靠 .home-active 的 CSS 隐藏，保留内部状态 */}
        {props.sidebar(isOpen, setIsOpen, isMobile)}

        <main
          id="app"
          classList={{ "sidebar-shifted": isOpen() && !isMobile() && !isHomeOpen() }}
        >
          <Show when={!isHomeOpen()} fallback={<Home />}>
            {props.children}
          </Show>
        </main>
      </div>
    </div>
  );
};
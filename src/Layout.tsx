// src/Layout.tsx
import { createSignal, onMount, onCleanup, type JSX } from "solid-js";
import "./Layout.scss";

interface LayoutProps {
  // 🌟 核心：插槽函数新增第三个参数 isMobile
  sidebar: (
    isOpen: boolean,
    setIsOpen: (open: boolean) => void,
    isMobile: boolean,
  ) => JSX.Element;
  children: JSX.Element;
}

export const Layout = (props: LayoutProps) => {
  const [isMobile, setIsMobile] = createSignal(window.innerWidth <= 768);
  const [isOpen, setIsOpen] = createSignal(window.innerWidth > 768);

  console.log(isMobile());
  console.log(window.innerWidth);
  const handleResize = () => {
    const mobile = window.innerWidth <= 768;
    setIsMobile(mobile);
    if (!mobile) {
      setIsOpen(true);
    }
  };

  onMount(() => window.addEventListener("resize", handleResize));
  onCleanup(() => window.removeEventListener("resize", handleResize));

  return (
    <div class="app-layout">
      {/* 头部区域略... */}


      <header class="app-header">
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
      <div class="header-title">🎬 VidViewer</div>
    </header>

      <div class="layout-body">
        {/* 🌟 核心：执行函数插槽，把三个状态全部交出去 */}
        {props.sidebar(isOpen(), setIsOpen, isMobile())}

        <main
          id="app"
          classList={{ "sidebar-shifted": isOpen() && !isMobile() }}
        >
          {props.children}
        </main>
      </div>
    </div>
  );
};

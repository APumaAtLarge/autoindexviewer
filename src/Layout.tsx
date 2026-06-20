// // src/Layout.tsx
// import { createSignal, onMount, onCleanup, type JSX } from "solid-js";
// import "./Layout.scss";

// // interface LayoutProps {
// //   // 🌟 核心：插槽函数新增第三个参数 isMobile
// //   sidebar: (
// //     isOpen: boolean,
// //     setIsOpen: (open: boolean) => void,
// //     isMobile: boolean,
// //   ) => JSX.Element;
// //   children: JSX.Element;
// // }

// interface LayoutProps {
//   sidebar: (
//     isOpen: () => boolean,
//     setIsOpen: (open: boolean) => void,
//     isMobile: () => boolean,
//   ) => JSX.Element;
//   children: JSX.Element;
// }

// const SCROLL_THRESHOLD = 8; // 滚动幅度小于这个值不触发，防抖动

// export const Layout = (props: LayoutProps) => {
//   const [isMobile, setIsMobile] = createSignal(window.innerWidth <= 768);
//   const [isOpen, setIsOpen] = createSignal(window.innerWidth > 768);

//   console.log(isMobile());
//   console.log(window.innerWidth);
//   const handleResize = () => {
//     const mobile = window.innerWidth <= 768;
//     setIsMobile(mobile);
//     if (!mobile) {
//       setIsOpen(true);
//     }
//   };

//   onMount(() => window.addEventListener("resize", handleResize));
//   onCleanup(() => window.removeEventListener("resize", handleResize));

//   return (
//     <div class="app-layout">
//       {/* 头部区域略... */}

//       <header class="app-header">
//         <button class="sidebar-toggle-btn" onClick={() => setIsOpen(!isOpen())}>
//           {isOpen() ? "✕ 关闭" : "☰ 目录"}
//         </button>
//         <a
//           href={(() => {
//             const p = window.location.pathname.replace(/\/$/, "");
//             return p.includes("/") ? p.slice(0, p.lastIndexOf("/")) + "/" : "/";
//           })()}
//           class="header-back-btn"
//           title="返回上一级"
//         >
//           ← 上级
//         </a>
//         <div class="header-title">🎬 VidViewer</div>
//       </header>

//       <div class="layout-body">
//         {/* 🌟 核心：执行函数插槽，把三个状态全部交出去 */}
//         {/* {props.sidebar(isOpen(), setIsOpen, isMobile())} */}
//         {/* 不再调用 isOpen()/isMobile()，直接传函数引用 */}
//         {props.sidebar(isOpen, setIsOpen, isMobile)}
//         <main
//           id="app"
//           classList={{ "sidebar-shifted": isOpen() && !isMobile() }}
//         >
//           {props.children}
//         </main>
//       </div>
//     </div>
//   );
// };
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
// // src/Layout.tsx
// import { createSignal, onMount, onCleanup, type JSX } from "solid-js";
// import "./Layout.scss";

// interface LayoutProps {
//   sidebar: (
//     isOpen: () => boolean,
//     setIsOpen: (open: boolean) => void,
//     isMobile: () => boolean,
//   ) => JSX.Element;
//   children: JSX.Element;
// }

// const SCROLL_DELTA_THRESHOLD = 8; // 滚动幅度小于这个值不触发，防抖动
// const SCROLL_TOP_LOCK = 56;       // 距顶部很近时强制展开，避免来回闪烁

// export const Layout = (props: LayoutProps) => {
//   const [isMobile, setIsMobile] = createSignal(window.innerWidth <= 768);
//   const [isOpen, setIsOpen] = createSignal(window.innerWidth > 768);
//   const [headerHidden, setHeaderHidden] = createSignal(false);

//   const handleResize = () => {
//     const mobile = window.innerWidth <= 768;
//     setIsMobile(mobile);
//     if (!mobile) {
//       setIsOpen(true);
//       setHeaderHidden(false); // PC 端不折叠
//     }
//   };

//   // 🌟 滚动折叠吸顶 header（仅移动端）
//   // 页面是 window 整体滚动撑起来的（header 用的是 sticky 而非 main 内部滚动），
//   // 所以监听 window scroll 即可，不需要额外监听 main。
//   let lastY = window.scrollY;
//   const handleScroll = () => {
//     if (!isMobile()) return;
//     const y = window.scrollY;
//     const delta = y - lastY;

//     if (y <= SCROLL_TOP_LOCK) {
//       setHeaderHidden(false);
//     } else if (delta > SCROLL_DELTA_THRESHOLD) {
//       setHeaderHidden(true);  // 向下滚动 → 折叠
//     } else if (delta < -SCROLL_DELTA_THRESHOLD) {
//       setHeaderHidden(false); // 向上滚动 → 展开
//     }
//     lastY = y;
//   };

//   onMount(() => {
//     window.addEventListener("resize", handleResize);
//     window.addEventListener("scroll", handleScroll, { passive: true });
//   });
//   onCleanup(() => {
//     window.removeEventListener("resize", handleResize);
//     window.removeEventListener("scroll", handleScroll);
//   });

//   return (
//     <div class="app-layout" classList={{ "header-hidden": headerHidden() }}>
//       <header class="app-header">
//         <button class="sidebar-toggle-btn" onClick={() => setIsOpen(!isOpen())}>
//           {isOpen() ? "✕ 关闭" : "☰ 目录"}
//         </button>
//         <a
//           href={(() => {
//             const p = window.location.pathname.replace(/\/$/, "");
//             return p.includes("/") ? p.slice(0, p.lastIndexOf("/")) + "/" : "/";
//           })()}
//           class="header-back-btn"
//           title="返回上一级"
//         >
//           ← 上级
//         </a>
//         <div class="header-title">🎬 VidViewer</div>
//       </header>

//       <div class="layout-body">
//         {props.sidebar(isOpen, setIsOpen, isMobile)}

//         <main
//           id="app"
//           classList={{ "sidebar-shifted": isOpen() && !isMobile() }}
//         >
//           {props.children}
//         </main>
//       </div>
//     </div>
//   );
// };
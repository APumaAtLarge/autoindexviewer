// src/Sidebar.tsx
import { createSignal, onMount, For, Show } from "solid-js";
import { parseNginxHtml, type FileNode } from "./utils/parser";
import { videoUrl, setVideoUrl,setIsHls } from "./store"; // 🌟 1. 导入当前的视频 URL 状态和设置函数
import "./Sidebar.scss";

export const Sidebar = () => {
  const [items, setItems] = createSignal<FileNode[]>([]);
  const [loading, setLoading] = createSignal<boolean>(true);
  const [error, setError] = createSignal<string | null>(null);

  onMount(async () => {
    try {
      const targetFetchUrl = new URL(".", window.location.href).href;
      const response = await fetch(targetFetchUrl);
      if (!response.ok) throw new Error(`请求失败: ${response.status}`);
      const htmlText = await response.text();
      const result = parseNginxHtml(htmlText, targetFetchUrl);
      setItems(result.items);
    } catch (err: any) {
      setError(err.message || "未知错误");
    } finally {
      setLoading(false);
    }
  });

  // 🌟 2. 视频后缀判断函数
  const isVideoFile = (url: string) => {
    return /\.(mp4|m3u8|mkv|avi|mov|webm)$/i.test(url);
  };

// 🌟 2. 核心：接管点击事件，同步更新视频 URL 和 HLS 状态
const handleItemClick = (item: FileNode) => {
  if (!item.isDirectory && isVideoFile(item.url)) {
    
    // 判断点击的新视频是否是 HLS 流 (.m3u8)
    const isM3u8 = /\.m3u8$/i.test(item.url);
    
    // 关键：必须在设置 videoUrl 之前或同时更新 HLS 状态
    // 这样 VideoPlayer 的 createEffect 重新运行时，才能拿到正确的插件配置
    setIsHls(isM3u8);
    setVideoUrl(item.url);

    // 同步修改浏览器地址栏而不刷新页面
    window.history.pushState(null, "", item.url);
  } else {
    // 如果是目录，依然走原有的整页跳转逻辑
    window.location.href = item.url;
  }
};

  return (
    <div class="Sidebar">
      <div class="header">
        <h3>📂 媒体目录</h3>
        <span class="subtitle">当前目录层级</span>
      </div>

      <Show when={loading()}>
        <div class="status">正在载入目录...</div>
      </Show>

      <Show when={error()}>
        <div class="status error">❌ {error()}</div>
      </Show>

      <Show when={!loading() && !error()}>
        <ul class="list">
          <For each={items()}>
            {(item) => (
              <li
                classList={{
                  item: true,
                  dir: item.isDirectory,
                  file: !item.isDirectory,
                  // 🌟 4. 关键：修正高亮判断
                  // 如果是文件夹，对比页面标准 URL；如果是视频，实时对比当前播放的 videoUrl()
                  active: item.isDirectory
                    ? window.location.href === item.url
                    : videoUrl() === item.url,
                }}
                onClick={() => handleItemClick(item)} // 🌟 传入整个 item 方便内部逻辑判断
                title={item.name}
              >
                <span class="icon">{item.isDirectory ? "📁" : "🎬"}</span>
                <span class="name">{item.name}</span>
              </li>
            )}
          </For>
        </ul>
      </Show>
    </div>
  );
};

// // src/Sidebar.tsx
// import { createSignal, onMount, For, Show } from "solid-js";
// import { parseNginxHtml, type FileNode } from "./utils/parser"; // 🌟 导入统一的 Nginx 解析函数与类型
// import "./Sidebar.scss";

// export const Sidebar = () => {
//   // 使用从 parser 导入的 FileNode 类型保持数据结构一致
//   const [items, setItems] = createSignal<FileNode[]>([]);
//   const [loading, setLoading] = createSignal<boolean>(true);
//   const [error, setError] = createSignal<string | null>(null);

//   onMount(async () => {
//     try {
//       // 🌟 核心改动 1：智能获取当前文件或目录的所属目录 URL
//       // 使用 new URL(".", window.location.href) 能够完美适配两种场景：
//       // 1. 如果当前是视频页面 (.../data/www-data/video.mp4)，它会剥离文件名，返回 📂 .../data/www-data/
//       // 2. 如果当前本身就是目录 (.../data/www-data/)，它会保持原样返回 📂 .../data/www-data/
//       const targetFetchUrl = new URL(".", window.location.href).href;

//       // 发起请求
//       const response = await fetch(targetFetchUrl);
//       if (!response.ok) throw new Error(`请求失败: ${response.status}`);
//       const htmlText = await response.text();

//       // 🌟 核心改动 2：调用封装好的解析工具，并传入基础 URL 补全绝对路径
//       const result = parseNginxHtml(htmlText, targetFetchUrl);

//       setItems(result.items);
//     } catch (err: any) {
//       setError(err.message || "未知错误");
//     } finally {
//       setLoading(false);
//     }
//   });

//   const handleItemClick = (url: string) => {
//     window.location.href = url;
//   };

//   return (
//     <div class="Sidebar">
//       <div class="header">
//         <h3>📂 媒体目录</h3>
//         <span class="subtitle">当前目录层级</span>{" "}
//         {/* 🌟 修正类名以匹配 SCSS */}
//       </div>

//       {/* 🌟 核心改动 3：修正状态、列表、单项的类名，使其与 Sidebar.scss 的嵌套样式完美对接 */}
//       <Show when={loading()}>
//         <div class="status">正在载入目录...</div>
//       </Show>

//       <Show when={error()}>
//         <div class="status error">❌ {error()}</div>
//       </Show>

//       <Show when={!loading() && !error()}>
//         <ul class="list">
//           <For each={items()}>
//             {(item) => (
//               <li
//                 /* SolidJS 的 classList 绑定，类名已全部对齐 SCSS */
//                 classList={{
//                   item: true,
//                   dir: item.isDirectory,
//                   file: !item.isDirectory,
//                   active: window.location.href === item.url, // 当浏览器地址栏和当前项 URL 一致时高亮
//                 }}
//                 onClick={() => handleItemClick(item.url)}
//                 title={item.name}
//               >
//                 <span class="icon">{item.isDirectory ? "📁" : "🎬"}</span>
//                 <span class="name">{item.name}</span>
//               </li>
//             )}
//           </For>
//         </ul>
//       </Show>
//     </div>
//   );
// };

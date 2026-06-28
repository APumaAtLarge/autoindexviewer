// src/main.tsx
import { render } from "solid-js/web";
import { App } from "./App";
import { setVideoUrl,setIsHls } from "./store/urlParams";

// 在应用入口文件顶部注册，保证所有 parseAndFilter 调用前就绪
import { registerInterceptor } from "./utils/interceptors";
import { trashInterceptor }    from "./utils/trashInterceptor";

registerInterceptor(trashInterceptor);
// main.tsx 顶部
history.scrollRestoration = "manual";
function initPlugin() {
  const currentUrl = window.location.href;
  const isMp4 = /\.mp4(?:\?.*)?$/i.test(currentUrl);
  const m3u8Link = document.querySelector<HTMLAnchorElement>('a[href$=".m3u8"]');

  // 1. 判断并更新视频状态
  if (isMp4 || m3u8Link) {
    const targetUrl = isMp4 ? currentUrl : m3u8Link!.href;
    const targetIsHls = /\.m3u8(?:\?.*)?$/i.test(targetUrl);
    setVideoUrl(targetUrl);
    setIsHls(targetIsHls);
  } else {
    // 明确清空状态，触发 App.tsx 渲染 fallback
    setVideoUrl("");
    setIsHls(false);
  }

  // 2. 🌟 强制清空 Nginx 原生的丑陋页面
  document.body.innerHTML = "";

  // 3. 挂载 SolidJS 容器
  const rootElement = document.createElement("div");
  rootElement.id = "solid-root";
  document.body.appendChild(rootElement);

  render(() => <App />, document.body);
}

initPlugin();




// 在入口文件（如 main.tsx/index.tsx）加这一行
const meta = document.createElement("meta");
meta.name = "viewport";
meta.content = "width=device-width, initial-scale=1.0";
document.head.appendChild(meta);
import { createSignal, onMount, For,Show } from "solid-js";
import { parseNginxHtml,type FileNode } from "./utils/parser"; // 引入纯函数
import "./DirectoryView.scss";

export function DirectoryView() {
  const [files, setFiles] = createSignal<FileNode[]>([]);
  const [title, setTitle] = createSignal<string>("载入中...");

  onMount(async () => {
    try {
      // 1. 获取 HTML
      const response = await fetch(window.location.href);
      if (!response.ok) throw new Error("网络请求失败");
      const htmlText = await response.text();

      // 2. 使用封装好的函数一行搞定解析
      const { title: parsedTitle, items } = parseNginxHtml(htmlText);

      // 3. 更新状态
      setTitle(parsedTitle);
      setFiles(items);
    } catch (err) {
      console.error("解析 Nginx 目录失败:", err);
      setTitle("解析目录失败");
    }
  });

 return (
 // 🌟 必须包裹在这个带 DirectoryView 类名的 div 中，SCSS 才会生效！
 <div class="DirectoryView">
   <h2 class="dir-title">🗂️ {title()}</h2>
   
   {/* 🌟 必须有这个 file-grid 容器，才能变成网格卡片布局！ */}
   <div class="file-grid">
     <For each={files()}>
       {(file) => (
         <a
           href={file.url}
           classList={{ "file-card": true, "is-dir": file.isDirectory }}
           title={file.name}
         >
           {/* 封面渲染逻辑 */}
           <div class="cover-wrapper">
             <Show 
               when={file.cover} 
               fallback={<div class="icon">{file.isDirectory ? "📁" : "📄"}</div>}
             >
               <img 
                 src={file.cover} 
                 alt={file.name} 
                 class="cover-img"
                 onError={(e) => {
                   e.currentTarget.style.display = 'none';
                   const fallbackIcon = e.currentTarget.nextElementSibling as HTMLElement;
                   if (fallbackIcon) fallbackIcon.style.display = 'block';
                 }}
               />
               <div class="default-icon icon" style="display: none;">
                 {file.isDirectory ? "📁" : (file.metadata ? "🎬" : "📄")}
               </div>
             </Show>
           </div>

           <div class="name">{file.name}</div>
           
           <Show when={file.metadata}>
             <div class="file-meta">
               <span class="size">{file.metadata!.size}</span>
               <span class="date">{file.metadata!.date}</span>
             </div>
           </Show>
         </a>
       )}
     </For>
   </div>
 </div>
);
}
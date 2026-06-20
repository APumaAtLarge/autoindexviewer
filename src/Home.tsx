// src/Home.tsx
import { createSignal, createEffect, For, Show } from "solid-js";
import { closeHome, isHomeOpen } from "./store/homeView";
import { apiGetAllTrashRecords, apiRestoreFile } from "./api/trash";
import type { TrashRecord } from "./db/trash";
import toast from "./ui/toast";
import "./Home.scss";

export function Home() {
  const [trashRecords, setTrashRecords] = createSignal<TrashRecord[]>([]);
  const [isLoading, setIsLoading] = createSignal(false);

  // 当主页打开时，拉取回收站数据
  createEffect(() => {
    if (isHomeOpen()) {
      fetchTrashData();
    }
  });

  const fetchTrashData = async () => {
    setIsLoading(true);
    try {
      const records = await apiGetAllTrashRecords();
      setTrashRecords(records);
    } catch (err) {
      console.error("加载回收站失败", err);
      toast.error("加载回收站数据失败");
    } finally {
      setIsLoading(false);
    }
  };

  // 导出 JSON 功能
  const handleExportJson = () => {
    const data = trashRecords();
    if (data.length === 0) {
      toast.error("回收站为空，没有可导出的数据");
      return;
    }

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    // 创建一个隐藏的 <a> 标签触发下载
    const a = document.createElement("a");
    a.href = url;
    a.download = `vidviewer_trash_${new Date().getTime()}.json`;
    document.body.appendChild(a);
    a.click();
    
    // 清理 DOM 和 URL 引用
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("已成功导出 JSON 文件");
  };

  // 单个文件还原功能
  const handleRestore = async (fileUrl: string, fileName: string) => {
    try {
      await apiRestoreFile(fileUrl);
      toast.success(`已还原: ${fileName}`);
      // 还原后刷新列表
      fetchTrashData();
    } catch (err) {
      console.error("还原失败", err);
      toast.error("还原失败");
    }
  };

  return (
    <div class="home-page">
      <div class="home-container">
        {/* 顶部控制栏 */}
        <div class="home-header">
          <div class="title-area">
            <span class="icon">🗑️</span>
            <h2>回收站管理</h2>
          </div>
          <div class="action-area">
            <button class="export-btn" onClick={handleExportJson}>
              📥 导出 JSON
            </button>
            <button class="home-exit-btn" onClick={closeHome}>
              ✖ 关闭
            </button>
          </div>
        </div>

        {/* 列表内容区 */}
        <div class="trash-list-wrapper">
          <Show when={!isLoading()} fallback={<div class="state-hint">加载中...</div>}>
            <Show 
              when={trashRecords().length > 0} 
              fallback={<div class="state-hint empty">回收站空空如也~</div>}
            >
              <div class="trash-list">
                <For each={trashRecords()}>
                  {(record) => (
                    <div class="trash-item">
                      <div class="item-info">
                        <div class="item-name">{record.fileName}</div>
                        <div class="item-path">{record.dirUri}</div>
                        <div class="item-time">
                          {new Date(record.deletedAt).toLocaleString()}
                        </div>
                      </div>
                      <div class="item-actions">
                        <button 
                          class="restore-btn" 
                          onClick={() => handleRestore(record.fileUrl, record.fileName)}
                        >
                          还原
                        </button>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </Show>
          </Show>
        </div>
      </div>
    </div>
  );
}
// src/DirectoryGrid.tsx
import {
  createSignal,
  createMemo,
  createEffect,
  onCleanup,
  For,
  Show,
} from "solid-js";
import { createVirtualizer } from "@tanstack/solid-virtual";
import { type FileNode } from "./utils/parser";
import { isImageUrl } from "./utils/isImage";
import { openDirectoryLightbox } from "./components/DirectoryLightbox";
import { parentItems } from "./store/directory";
import "./DirectoryGrid.scss";

interface DirectoryGridProps {
  title: string;
  files: FileNode[];
  currentUrl: string;
  onCardClick: (e: MouseEvent, file: FileNode) => void;
}

// 断点 → 列数，与原 CSS 完全一致
function calcCols(width: number): number {
  if (width <= 480) return 2;
  if (width <= 768) return 3;
  if (width <= 1024) return 4;
  return 5;
}

// gap px，与原 CSS 完全一致
function calcGap(cols: number): number {
  if (cols <= 2) return 10;
  if (cols <= 3) return 12;
  return 20;
}

export function DirectoryGrid(props: DirectoryGridProps) {
  let outerRef!: HTMLDivElement; // 整个组件根节点，用于 ResizeObserver
  let scrollRef!: HTMLDivElement; // 虚拟滚动容器

  const [containerW, setContainerW] = createSignal(0);

  // 监听容器宽度
  createEffect(() => {
    const ro = new ResizeObserver(([entry]) => {
      setContainerW(entry.contentRect.width);
    });
    ro.observe(outerRef);
    onCleanup(() => ro.disconnect());
  });

  const cols = createMemo(() => calcCols(containerW()));
  const gap = createMemo(() => calcGap(cols()));

  // 精确行高：卡片宽 × 9/16（cover-wrapper aspect-ratio）
  // 卡片宽 = (容器宽 - gap × (cols-1)) / cols
  const rowH = createMemo(() => {
    const c = cols();
    const g = gap();
    const w = containerW();
    if (w === 0) return 160; // 初始占位
    const cardW = (w - g * (c - 1)) / c;
    return Math.round(cardW * (9 / 16));
  });

  // 把 files 按列数切成行
  const rows = createMemo(() => {
    const c = cols();
    const result: FileNode[][] = [];
    for (let i = 0; i < props.files.length; i += c) {
      result.push(props.files.slice(i, i + c));
    }
    return result;
  });

  // 虚拟化行，间距通过 estimateSize 里加 gap 来体现
  const virtualizer = createVirtualizer({
    get count() {
      return rows().length;
    },
    getScrollElement: () => scrollRef,
    // 行高 + 行间距一起算进去，这样每行 top = virtualRow.start 就自动包含间距
    estimateSize: () => rowH() + gap(),
    overscan: 2,
  });

  return (
    // outerRef：测量容器宽度
    <div
      ref={outerRef!}
      style={{
        display: "flex",
        "flex-direction": "column",
        height: "100%",
        "min-height": "0",
      }}
    >
      <h2 class="dir-title">🗂️ {props.title}</h2>

      {/* scrollRef：虚拟滚动容器，撑满剩余高度 */}
      <div
        ref={scrollRef!}
        style={{
          flex: "1",
          "min-height": "0",
          "overflow-y": "auto",
          "scrollbar-width": "thin",
        }}
      >
        {/* 撑开总高度，让滚动条正确显示 */}
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            position: "relative",
          }}
        >
          <For each={virtualizer.getVirtualItems()}>
            {(vRow) => {
              const rowFiles = () => rows()[vRow.index];
              const isLastRow = () => vRow.index === rows().length - 1;

              return (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    // start 已经包含了上方所有行的 height+gap
                    transform: `translateY(${vRow.start}px)`,
                    // 行内用 flex 均分，彻底避免 grid 二维布局问题
                    display: "flex",
                    gap: `${gap()}px`,
                    // 最后一行不加底部 padding（或者加也无妨，看需求）
                    "padding-bottom": isLastRow() ? "0" : "0",
                  }}
                >
                  <For each={rowFiles()}>
                    {(file) => {
                      const imgSrc =
                        file.cover ?? (isImageUrl(file.url) ? file.url : null);
                      const isImg = !file.isDirectory && isImageUrl(file.url);

                      return (
                        // flex: 1 让每张卡片均分行宽，和原来 grid repeat(N,1fr) 完全等价
                        <a
                          href={file.url}
                          classList={{
                            "file-card": true,
                            "is-dir": file.isDirectory,
                          }}
                          style={{ flex: "1", "min-width": "0" }}
                          title={file.name}
                          onClick={(e) => {
                            e.preventDefault();
                            if (isImg) {
                              openDirectoryLightbox(
                                props.files,
                                file,
                                props.currentUrl,
                              );
                            } else {
                              props.onCardClick(e, file);
                            }
                          }}
                        >
                          <div class="cover-wrapper">
                            <Show
                              when={imgSrc}
                              fallback={
                                <div class="icon">
                                  {file.isDirectory ? "📁" : "📄"}
                                </div>
                              }
                            >
                              {(src) => (
                                <>
                                  <img
                                    src={src()}
                                    alt={file.name}
                                    class="cover-img"
                                    loading="lazy"
                                    onError={(e) => {
                                      e.currentTarget.style.display = "none";
                                      const icon = e.currentTarget
                                        .nextElementSibling as HTMLElement;
                                      if (icon) icon.style.display = "block";
                                    }}
                                  />
                                  <div
                                    class="default-icon icon"
                                    style="display:none"
                                  >
                                    {file.isDirectory
                                      ? "📁"
                                      : file.metadata
                                        ? "🎬"
                                        : "📄"}
                                  </div>
                                </>
                              )}
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
                      );
                    }}
                  </For>

                  {/* 最后一行不足 cols 个时，用空白占位保证卡片宽度一致 */}
                  <For each={Array(cols() - rowFiles().length)}>
                    {() => <div style={{ flex: "1", "min-width": "0" }} />}
                  </For>
                </div>
              );
            }}
          </For>
        </div>
      </div>
    </div>
  );
}

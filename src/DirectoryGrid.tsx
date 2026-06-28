// src/DirectoryGrid.tsx
import {
  createSignal,
  createMemo,
  createEffect,
  onCleanup,
  For,
} from "solid-js";
import { createVirtualizer } from "@tanstack/solid-virtual";
import { type FileNode } from "./utils/parser";
import { FileCard } from "./FileCard"; // 引入新组件
import "./DirectoryGrid.scss";

interface DirectoryGridProps {
  title: string;
  files: FileNode[];
  currentUrl: string;
  onCardClick: (e: MouseEvent, file: FileNode) => void;
}

function calcCols(width: number): number {
  if (width <= 480) return 2;
  if (width <= 768) return 3;
  if (width <= 1024) return 4;
  return 5;
}

function calcGap(cols: number): number {
  if (cols <= 2) return 10;
  if (cols <= 3) return 12;
  return 20;
}

export function DirectoryGrid(props: DirectoryGridProps) {
  let outerRef!: HTMLDivElement;
  let scrollRef!: HTMLDivElement;

  const [containerW, setContainerW] = createSignal(0);

  createEffect(() => {
    const ro = new ResizeObserver(([entry]) => {
      setContainerW(entry.contentRect.width);
    });
    ro.observe(outerRef);
    onCleanup(() => ro.disconnect());
  });

  const cols = createMemo(() => calcCols(containerW()));
  const gap = createMemo(() => calcGap(cols()));

  const rowH = createMemo(() => {
    const c = cols();
    const g = gap();
    const w = containerW();
    if (w === 0) return 160;
    const cardW = (w - g * (c - 1)) / c;
    return Math.round(cardW * (9 / 16));
  });

  const rows = createMemo(() => {
    const c = cols();
    const result: FileNode[][] = [];
    for (let i = 0; i < props.files.length; i += c) {
      result.push(props.files.slice(i, i + c));
    }
    return result;
  });

  const virtualizer = createVirtualizer({
    get count() {
      return rows().length;
    },
    getScrollElement: () => scrollRef,
    estimateSize: () => rowH() + gap(),
    overscan: 2,
  });

  return (
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

      <div
        ref={scrollRef!}
        style={{
          flex: "1",
          "min-height": "0",
          "overflow-y": "auto",
          "scrollbar-width": "thin",
        }}
      >
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
                    transform: `translateY(${vRow.start}px)`,
                    display: "flex",
                    gap: `${gap()}px`,
                    "padding-bottom": isLastRow() ? "0" : "0",
                  }}
                >
                  <For each={rowFiles()}>
                    {(file) => (
                      <FileCard
                        file={file}
                        files={props.files}
                        currentUrl={props.currentUrl}
                        onCardClick={props.onCardClick}
                      />
                    )}
                  </For>

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
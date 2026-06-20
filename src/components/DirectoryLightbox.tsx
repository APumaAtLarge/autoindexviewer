
// src/components/DirectoryLightbox.tsx
import { createEffect, createSignal, onCleanup, Show } from "solid-js";
import { Portal } from "solid-js/web";
import GLightbox from "glightbox";
import "glightbox/dist/css/glightbox.min.css";
import { type FileNode } from "../utils/parser";
import { isImageUrl } from "../utils/isImage";
import {
  getSiblingDirs,
  findNextNonEmptySibling,
} from "../utils/siblingFolder";

interface DirectoryLightboxProps {
  files: FileNode[];
  currentUrl: string;
}

export function DirectoryLightbox(props: DirectoryLightboxProps) {
  const [container, setContainer] = createSignal<HTMLElement | null>(null);

  let lightbox: ReturnType<typeof GLightbox> | null = null;
  let currentRotation = 0;
  let baseDirUrl = window.location.href;

  // ── 跨目录循环续播相关状态 ──
  let destroyed = false;
  let chainInitStarted = false;
  let chain: any = null;

  const loadNextChainBatch = async () => {
    if (!chain || chain.loading || chain.exhausted || destroyed) return;
    chain.loading = true;

    const match = await findNextNonEmptySibling(
      chain.dirs,
      chain.cursor,
      chain.currentIndex
    );

    if (destroyed || !chain) return;

    if (!match) {
      chain.exhausted = true;
      chain.loading = false;
      return;
    }

    const batchStart = chain.totalSlides;
    match.images.forEach((img: any) => {
      (lightbox as any)?.insertSlide({
        href: img.url,
        type: "image",
        title: img.name,
      });
    });

    chain.cursor = match.index;
    chain.totalSlides += match.images.length;
    chain.latestBatchStart = batchStart;
    chain.loading = false;
  };

  const ensureChainInit = async (dirUrl: string) => {
    const siblings = await getSiblingDirs(dirUrl);
    if (destroyed) return;
    if (!siblings) {
      chain = null;
      return;
    }

    const originalImageCount = props.files.filter(
      (f) => !f.isDirectory && isImageUrl(f.url)
    ).length;

    chain = {
      dirs: siblings.dirs,
      currentIndex: siblings.currentIndex,
      cursor: siblings.currentIndex,
      totalSlides: originalImageCount,
      latestBatchStart: originalImageCount,
      loading: false,
      exhausted: false,
    };

    await loadNextChainBatch();
  };

  const initLightbox = () => {
    destroyed = false;
    chainInitStarted = false;
    chain = null;
    setContainer(null);

    lightbox?.destroy();
    lightbox = GLightbox({
      selector: ".glightbox",
      touchNavigation: true,
      loop: true,
      zoomable: true,
      draggable: true,
      openEffect: "zoom",
    });

    lightbox.on("open", () => {
      baseDirUrl = window.location.href;

      const el = document.querySelector(".glightbox-container") as HTMLElement;
      if (el) setContainer(el);

      if (!chainInitStarted) {
        chainInitStarted = true;
        ensureChainInit(props.currentUrl);
      }
    });

    lightbox.on("slide_changed", (({ current }: any) => {
      currentRotation = 0;
      const fileUrl = current?.slideConfig?.href;
      if (fileUrl) {
        window.history.pushState(null, "", fileUrl);
      }

      if (
        chain &&
        !chain.exhausted &&
        !chain.loading &&
        typeof current?.index === "number" &&
        current.index >= chain.latestBatchStart
      ) {
        loadNextChainBatch();
      }
    }) as any);

    lightbox.on("close", () => {
      window.history.pushState(null, "", baseDirUrl);
      setContainer(null);
    });
  };

  const handleRotate = () => {
    const activeSlide = document.querySelector(".gslide.current");
    if (!activeSlide) return;

    const img = activeSlide.querySelector<HTMLImageElement>(".gslide-image img") ;
    const mediaNode = activeSlide.querySelector<HTMLElement>(".gslide-media");
    if (img && mediaNode) {
      currentRotation = (currentRotation + 90) % 360;
      if (currentRotation === 90 || currentRotation === 270) {
        // 计算旋转后的比例因子，使图片能适配容器
        // 图片本身宽高
        const imgWidth = img.naturalWidth || img.offsetWidth;
        const imgHeight = img.naturalHeight || img.offsetHeight;
        // 容器宽高
        const containerWidth = mediaNode.offsetWidth;
        const containerHeight = mediaNode.offsetHeight;

        // 计算比例：新图宽 (imgHeight) / 容器宽 (containerWidth)，新图高 (imgWidth) / 容器高 (containerHeight)
        // 选取其中较小的一个作为缩放比例，并确保不放大图片（Scale <= 1）
        const scaleFactor = Math.min(
          containerWidth / imgHeight,
          containerHeight / imgWidth,
          1
        );
        img.style.transform = `rotate(${currentRotation}deg) scale(${scaleFactor})`;
      } else {
        // 正常角度，无需特殊缩放
        img.style.transform = `rotate(${currentRotation}deg) scale(1)`;
      }
      img.style.transition = "transform 0.3s ease";
    }
  };

  createEffect(() => {
    if (props.files.length >= 0) {
      queueMicrotask(initLightbox);
    }
  });

  onCleanup(() => {
    destroyed = true;
    lightbox?.destroy();
  });

  return (
    <Show when={container()}>
      {(el) => (
        <Portal mount={el()}>
          <button
            class="grotate-btn"
            ref={(el) => {
              // 1. 拦截原生点击事件
              el.addEventListener("click", (e) => {
                e.stopPropagation();
                handleRotate();
              });

              // 2. 拦截可能导致关闭的按下事件
              el.addEventListener("mousedown", (e) => e.stopPropagation());
              el.addEventListener(
                "touchstart",
                (e) => {
                  e.stopPropagation();
                  // 可以在这里也触发 handleRotate，避免触屏点击不灵敏
                  // handleRotate();
                },
                { passive: false }
              );
              el.addEventListener("pointerdown", (e) => e.stopPropagation());
            }}
          >
            🔄 旋转
          </button>
        </Portal>
      )}
    </Show>
  );
}

// src/Home.tsx
import { closeHome } from "./store/homeView";
import "./Home.scss";

export function Home() {
  return (
    <div class="home-page">
      <div class="home-placeholder">
        <div class="home-placeholder-icon">🏠</div>
        <div class="home-placeholder-text">主页内容建设中…</div>
        <button class="home-exit-btn" onClick={closeHome}>
          ← 返回
        </button>
      </div>
    </div>
  );
}
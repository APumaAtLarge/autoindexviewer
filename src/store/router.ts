
import { setVideoUrl, setIsHls } from "./urlParams";
import { setCurrentUrl, fetchCurrent, setParentItems } from "./directory";

export async function navigate(url: string) {
  const isVideo = /\.(mp4|m3u8|mkv|avi|mov|webm)$/i.test(url);

  history.pushState(null, "", url);

  if (isVideo) {
    setVideoUrl(url);
    setIsHls(/\.m3u8$/i.test(url));
    return;
  }

  // 目录
  setVideoUrl("");

  setCurrentUrl(url);
  setParentItems([]);
  await fetchCurrent(url);
}
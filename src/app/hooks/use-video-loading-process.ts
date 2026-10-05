/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';

// Если загрузка не двигается столько времени, дальше не ждём:
// так бывает в режиме энергосбережения на iOS, при экономии трафика или без кодека.
const STALL_MS = 4000;
const CHECK_MS = 200;

// Доля скачанного видео: 1, когда файл в буфере почти целиком (или не грузится из-за ошибки).
// Safari может держать буфер кусками и не дотягивать до самого конца, поэтому
// складываем все куски и считаем 97% полной загрузкой.
const bufferedShare = (video: HTMLVideoElement) => {
  if (video.error) return 1;
  if (!(video.duration > 0)) return 0;
  let seconds = 0;
  for (let i = 0; i < video.buffered.length; i++) {
    seconds += video.buffered.end(i) - video.buffered.start(i);
  }
  const share = Math.min(seconds / video.duration, 1);
  return share >= 0.97 ? 1 : share;
};

// Прогресс загрузки нескольких видео (0–100) с весами по размеру файлов.
export const useVideoLoadingProgress = (videos: { id: string; weight: number }[]) => {
  const [progress, setProgress] = useState(0);
  const key = videos.map((v) => `${v.id}:${v.weight}`).join(',');

  useEffect(() => {
    const total = videos.reduce((sum, v) => sum + v.weight, 0);
    let last = -1;
    let lastChangeAt = Date.now();

    const tick = () => {
      let sum = 0;
      for (const { id, weight } of videos) {
        const video = document.getElementById(id) as HTMLVideoElement | null;
        if (video) sum += weight * bufferedShare(video);
      }

      let next = Math.round((sum / total) * 100);
      const now = Date.now();
      if (next !== last) {
        last = next;
        lastChangeAt = now;
      } else if (now - lastChangeAt > STALL_MS) {
        next = 100;
      }

      setProgress((prev) => Math.max(prev, next));
      if (next >= 100) clearInterval(interval);
    };

    const interval = setInterval(tick, CHECK_MS);
    tick();
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return progress;
};

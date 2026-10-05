'use client';

import { forwardRef } from 'react';

// Hero-видео: отдельная вертикальная версия для телефонов (608×1080, ≈2 МБ),
// десктопная 1920×1080 (≈4 МБ), постер на случай, если автоплей запрещён.
// Браузер сам выбирает <source> по media; JS не нужен, гидратация не ломается.
export const HeroVideo = forwardRef<HTMLVideoElement>(function HeroVideo(_, ref) {
  return (
    <video
      ref={ref}
      id="main-video-banner"
      className="home-video"
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      disableRemotePlayback
      poster="/v2/southuuub-poster.webp"
    >
      <source src="/v2/southuuub-mobile.mp4" type="video/mp4" media="(max-width: 767px) and (orientation: portrait)" />
      <source src="/v2/southuuub.mp4" type="video/mp4" />
    </video>
  );
});

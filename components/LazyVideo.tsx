'use client';

import { useEffect, useRef } from 'react';

type Props = {
  id: string;
  src: string;
  poster: string;
  className?: string;
};

// Видео ниже первого экрана (SH25, SB25): ничего не грузится до подлёта к экрану,
// играет только в зоне видимости, при «уменьшить движение» остаётся постер.
export const LazyVideo = ({ id, src, poster, className }: Props) => {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!video.src) { video.src = src; video.load(); }
          if (!reduce) video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { rootMargin: '400px 0px' },
    );
    io.observe(video);
    return () => io.disconnect();
  }, [src]);

  return (
    <video
      ref={ref}
      id={id}
      className={className}
      muted
      loop
      playsInline
      preload="none"
      disableRemotePlayback
      poster={poster}
    />
  );
};

// Использование вместо текущих <video autoPlay preload="metadata">:
// <LazyVideo id="south-hub-video" src="/v2/SH25.mp4" poster="/v2/SH25-poster.webp" className="our-projects-item-right-img" />
// <LazyVideo id="snow-base-video" src="/v2/SB25.mp4" poster="/v2/SB25-poster.webp" className="our-projects-item-right-img" />

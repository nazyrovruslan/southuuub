'use client';

import { useEffect, useRef } from 'react';

type Props = {
  src: string;
  poster?: string;
  id?: string;
  className?: string;
};

// Видео начинает грузиться только при приближении к экрану (за ~1 экран),
// а до этого показывает постер. Без этого все ролики качаются при открытии страницы.
export const LazyVideo = ({ src, poster, id, className }: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // для Safari: muted должен быть атрибутом, иначе play() отклоняется
    video.muted = true;
    video.setAttribute('muted', '');

    const start = () => {
      if (video.preload !== 'auto') {
        video.preload = 'auto';
        video.load();
      }
      if (!reduceMotion) video.play().catch(() => {});
    };

    if (!('IntersectionObserver' in window)) {
      start();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) start();
          else if (!video.paused) video.pause();
        });
      },
      { rootMargin: '100% 0px' },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <video
      ref={videoRef}
      className={className}
      muted
      loop
      playsInline
      preload="none"
      poster={poster}
      id={id}
      disableRemotePlayback
    >
      <source src={src} type="video/mp4" />
    </video>
  );
};

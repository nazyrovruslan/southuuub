'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { FONT_IBM_PLEX_SERIF_LIGHT } from '@/fonts'; // путь к шрифтам как в проекте

import step1 from '@/assets/preloader-icon-1.svg';
import step2 from '@/assets/preloader-icon-2.svg';
import step3 from '@/assets/preloader-icon-3.svg';

const STEPS = [step1, step2, step3];

// Прелоадер больше не ждёт полной загрузки видео.
// Готовность: hero-видео может начать играть (canplay) И документ загружен.
// В любом случае прелоадер уходит через MAX_WAIT_MS, даже если видео не грузится
// (энергосбережение на iOS, экономия трафика, блокировщик, нет кодека).
const HERO_VIDEO_ID = 'main-video-banner';
const MAX_WAIT_MS = 2500;
const FADE_MS = 600;

export const Preloader = () => {
  const [visible, setVisible] = useState(true);
  const [hiding, setHiding] = useState(false);
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const done = useRef(false);

  useEffect(() => {
    let videoReady = false;
    let pageReady = document.readyState === 'complete';

    const finish = () => {
      if (done.current) return;
      done.current = true;
      setProgress(100);
      setHiding(true);
      window.setTimeout(() => setVisible(false), FADE_MS);
    };
    const check = () => {
      setProgress(Math.round((Number(videoReady) + Number(pageReady)) * 50));
      if (videoReady && pageReady) finish();
    };

    const video = document.getElementById(HERO_VIDEO_ID) as HTMLVideoElement | null;
    const onVideo = () => { videoReady = true; check(); };
    if (!video || video.readyState >= 3) videoReady = true;
    else {
      video.addEventListener('canplay', onVideo, { once: true });
      video.addEventListener('error', onVideo, { once: true });
    }

    const onLoad = () => { pageReady = true; check(); };
    if (!pageReady) window.addEventListener('load', onLoad, { once: true });

    const timeout = window.setTimeout(finish, MAX_WAIT_MS);
    const ticker = window.setInterval(() => setStep(s => (s + 1) % STEPS.length), 500);
    check();

    return () => {
      video?.removeEventListener('canplay', onVideo);
      video?.removeEventListener('error', onVideo);
      window.removeEventListener('load', onLoad);
      window.clearTimeout(timeout);
      window.clearInterval(ticker);
    };
  }, []);

  // Пока прелоадер виден, страница не прокручивается.
  useEffect(() => {
    const root = document.documentElement;
    root.style.overflowY = visible ? 'hidden' : '';
    if (!visible) window.scrollTo({ top: 0 });
    return () => { root.style.overflowY = ''; };
  }, [visible]);

  if (!visible) return null;

  return (
    <div className={`preloader ${hiding ? 'preloader--hidden' : ''}`} aria-hidden="true">
      <div className="preloader__content">
        <div className="preloader__images">
          {STEPS.map((src, i) => (
            <Image
              key={i}
              src={src}
              alt=""
              width={280}
              height={80}
              priority
              unoptimized
              className={`preloader__image ${step === i ? 'preloader__image--active' : ''}`}
            />
          ))}
        </div>
        <div className={`preloader__progress ${FONT_IBM_PLEX_SERIF_LIGHT.className}`}>{progress}%</div>
      </div>
    </div>
  );
};

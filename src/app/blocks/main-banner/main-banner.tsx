"use client";

import { FONT_IBM_PLEX_SERIF_ITALIC, FONT_MONT_BOOK } from "../../fonts";
import { MainBannerButton } from "./main-banner-button";
import { useEffect, useRef } from "react";
import gsap from "gsap";

import "./main-banner.css";
import { NBSP, PRELOADER_HIDE_EVENT } from "@/app/constants";

// Первый экран — один экран без закрепления: обе фразы с подзаголовками и кнопка видны сразу.

export const MainBanner = () => {
  const contentRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Появление первого экрана: прелоадер уезжает вверх, под ним уже идёт видео,
  // а контент немного выезжает снизу из прозрачности.
  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const reveal = () => {
      gsap.to(content, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        delay: 0.25,
        ease: "power3.out",
      });
    };

    if (window.__preloaderHidden || !document.querySelector(".preloader")) {
      reveal();
      return;
    }

    gsap.set(content, { opacity: 0, y: 40 });
    window.addEventListener(PRELOADER_HIDE_EVENT, reveal, { once: true });
    return () => window.removeEventListener(PRELOADER_HIDE_EVENT, reveal);
  }, []);

  // Видео первого экрана не декодируется, пока его не видно
  useEffect(() => {
    const section = sectionRef.current;
    const video = videoRef.current;
    if (!section || !video) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        if (video.paused) video.play().catch(() => {});
      } else {
        video.pause();
      }
    });

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  // Safari не всегда запускает autoPlay у видео, которое React вставил на клиенте:
  // muted у React — свойство, а не атрибут, и Safari считает видео «со звуком».
  // Ставим атрибут явно и запускаем воспроизведение сами, когда видео готово.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");

    const tryPlay = () => {
      if (video.paused) video.play().catch(() => {});
    };
    tryPlay();
    video.addEventListener("loadeddata", tryPlay);
    video.addEventListener("canplay", tryPlay);
    return () => {
      video.removeEventListener("loadeddata", tryPlay);
      video.removeEventListener("canplay", tryPlay);
    };
  }, []);

  return (
    <div className="main-banner-wrapper" id="main-banner" ref={sectionRef}>
      <div className="main-banner-pin-wrapper">
        <div className="video-wrapper">
          <video
            ref={videoRef}
            className="home-video"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            id="main-video-banner"
            poster="/v2/southuuub-poster.webp"
            disableRemotePlayback
          >
            {/* Вертикальная версия для телефонов: 608×1080, ~2 МБ вместо 6 МБ */}
            <source
              src="/v2/southuuub-mobile.mp4"
              type="video/mp4"
              media="(max-width: 767px) and (orientation: portrait)"
            />
            {/* Ноутбуки без Retina: 720p, ~2 МБ вместо 4 МБ, на таких экранах разницы не видно */}
            <source
              src="/v2/southuuub-720.mp4"
              type="video/mp4"
              media="(max-width: 1440px) and (max-resolution: 1.5dppx)"
            />
            <source src="/v2/southuuub.mp4" type="video/mp4" />
          </video>
        </div>

        <div className="main-banner-content" ref={contentRef}>
          <div className="main-banner-group">
            <div className={`${FONT_MONT_BOOK.className} main-banner-text main-banner-text-1`}>
              {"сообщество\nC-level в IT"}
            </div>

            <div className={`${FONT_MONT_BOOK.className} main-banner-text main-banner-text-2`}>
              {`здесь лидеры находят партнёрства,\nресурсы и${NBSP}смыслы, которых\nне встретить онлайн.`}
            </div>
          </div>

          <div className="main-banner-group">
            <div className={`${FONT_MONT_BOOK.className} main-banner-text main-banner-text-3`}>
              <span>{`мы переизобрели\nнетворкинг и получили`}</span>

              <div className={`${FONT_IBM_PLEX_SERIF_ITALIC.className} main-banner-text-3-netwarming`}>
                netwarming <span>&mdash;</span>
              </div>
            </div>

            <div className={`${FONT_MONT_BOOK.className} main-banner-text main-banner-text-4`}>
              это искусство встречаться по-настоящему: с теплом, доверием и
              искренностью. это свежий воздух вместо офисных переговорок, живой
              смех вместо холодных встреч, свобода вместо тесных рамок. и юг как
              состояние души.
            </div>
          </div>

          <div className="main-banner-button-wrapper">
            <MainBannerButton />
          </div>
        </div>
      </div>
    </div>
  );
};

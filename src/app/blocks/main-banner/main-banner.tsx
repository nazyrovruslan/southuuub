"use client";

import { FONT_IBM_PLEX_SERIF_ITALIC, FONT_MONT_BOOK } from "../../fonts";
import { MainBannerButton } from "./main-banner-button";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import "./main-banner.css";
import { NBSP, PRELOADER_HIDE_EVENT } from "@/app/constants";

// Первый экран закреплён через position: sticky (без JS-пина, который дёргается на iOS),
// секция выше окна на HERO_SCROLL_SCREENS экранов. На HERO_SWITCH_AT этого пути
// сцена сменяется целиком: тексты первого экрана уходят, видео зумится, появляется второй.
// Без докрутки: прокрутка остаётся у пользователя, ничего не спорит с трекпадом.
const HERO_SWITCH_AT = 0.4;

export const MainBanner = () => {
  const contentRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const videoWrapperRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const mainBannerText1 = useRef<HTMLDivElement>(null);
  const mainBannerText2 = useRef<HTMLDivElement>(null);
  const mainBannerText3 = useRef<HTMLDivElement>(null);
  const mainBannerText4 = useRef<HTMLDivElement>(null);

  const buttonRef = useRef<HTMLDivElement>(null);

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

  // Одна точка смены сцены вместо пяти отдельных триггеров
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const section = sectionRef.current;
    const videoWrapper = videoWrapperRef.current;
    if (!section || !videoWrapper) return;

    const firstScene = [mainBannerText1.current, mainBannerText2.current].filter(Boolean) as HTMLElement[];
    const secondScene = [mainBannerText3.current, mainBannerText4.current].filter(Boolean) as HTMLElement[];
    let isSecond: boolean | null = null;

    const showScene = (second: boolean, immediate: boolean) => {
      if (second === isSecond) return;
      isSecond = second;

      const duration = immediate ? 0 : 0.5;
      gsap.to(firstScene, {
        opacity: second ? 0 : 1,
        y: second ? -30 : 0,
        duration,
        ease: second ? "power3.in" : "power3.out",
        overwrite: "auto",
      });
      gsap.to(secondScene, {
        opacity: second ? 1 : 0,
        y: second ? 0 : 30,
        duration,
        // второй экран появляется, когда первый почти ушёл
        delay: second && !immediate ? 0.2 : 0,
        stagger: second && !immediate ? 0.1 : 0,
        ease: second ? "power3.out" : "power3.in",
        overwrite: "auto",
      });
      gsap.to(videoWrapper, {
        scale: second ? 1.5 : 1,
        duration: immediate ? 0 : 0.8,
        ease: "power2.out",
        overwrite: "auto",
      });
    };

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => showScene(self.progress >= HERO_SWITCH_AT, false),
    });

    // при перезагрузке посреди страницы сразу показываем нужную сцену, без анимации
    showScene(trigger.progress >= HERO_SWITCH_AT, true);

    return () => {
      trigger.kill();
      gsap.killTweensOf([...firstScene, ...secondScene, videoWrapper]);
    };
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
      <div className="main-banner-pin-wrapper" ref={pinRef}>
        <div className="video-wrapper" ref={videoWrapperRef}>
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
          <div
            ref={mainBannerText1}
            className={`${FONT_MONT_BOOK.className} main-banner-text main-banner-text-1`}
          >
            {"сообщество\nC-level в IT"}
          </div>

          <div
            ref={mainBannerText2}
            className={`${FONT_MONT_BOOK.className} main-banner-text main-banner-text-2`}
          >
            {`здесь лидеры находят партнёрства,\nресурсы и${NBSP}смыслы, которых\nне встретить онлайн.`}
          </div>

          <div
            ref={mainBannerText3}
            className={`${FONT_MONT_BOOK.className} main-banner-text main-banner-text-3`}
          >
            <span>{`мы переизобрели\nнетворкинг и получили`}</span>

            <div
              className={`${FONT_IBM_PLEX_SERIF_ITALIC.className} main-banner-text-3-netwarming`}
            >
              netwarming <span>&mdash;</span>
            </div>
          </div>

          <div
            ref={mainBannerText4}
            className={`${FONT_MONT_BOOK.className} main-banner-text main-banner-text-4`}
          >
            это искусство встречаться по-настоящему: с теплом, доверием и
            искренностью. это свежий воздух вместо офисных переговорок, живой
            смех вместо холодных встреч, свобода вместо тесных рамок. и юг как
            состояние души.
          </div>

          <div ref={buttonRef} className="main-banner-button-wrapper">
            <MainBannerButton />
          </div>
        </div>
      </div>
    </div>
  );
};

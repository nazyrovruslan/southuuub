"use client";

import { FONT_IBM_PLEX_SERIF_ITALIC, FONT_MONT_BOOK } from "../../fonts";
import { MainBannerButton } from "./main-banner-button";
import { useEffect, useRef } from "react";
import gsap from "gsap";

import "./main-banner.css";
import { NBSP, PRELOADER_HIDE_EVENT } from "@/app/constants";

// Первый экран листается по шагам, как слайды: один свайп (жест колесом или трекпадом) —
// ровно один шаг, сколько бы ни тянули. Шаги: заголовок, заголовок с подзаголовком,
// второй заголовок, второй заголовок с подзаголовком. Ролик поделён на две части:
// под первым заголовком крутится начало (крупные планы), второй заголовок начинается
// с кадра, где буква U видна целиком, видео приближается, и дальше крутится конец ролика. Пока шаги
// не пройдены, страница стоит наверху; после последнего шага следующий свайп прокручивает
// страницу как обычно, а свайп вниз у самого верха возвращает шаги назад.
const HERO_LAST_STEP = 3;
// первая часть ролика — до этой секунды, вторая — с этой
const HERO_PART1_END = 8.4;
const HERO_PART2_START = 9;
const HERO_VIDEO_ZOOM = 1.5;
// жест закончился, если колесо молчит столько миллисекунд (инерция трекпада идёт дольше)
const HERO_GESTURE_GAP_MS = 180;
// и не раньше, чем доиграла смена шага
const HERO_STEP_LOCK_MS = 800;
// минимальный путь пальца для шага
const HERO_SWIPE_PX = 30;

export const MainBanner = () => {
  const contentRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const videoWrapperRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const mainBannerText1 = useRef<HTMLDivElement>(null);
  const mainBannerText2 = useRef<HTMLDivElement>(null);
  const mainBannerText3 = useRef<HTMLDivElement>(null);
  const mainBannerText4 = useRef<HTMLDivElement>(null);

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

  // Шаги первого экрана по жестам
  useEffect(() => {
    const videoWrapper = videoWrapperRef.current;
    const video = videoRef.current;
    const text1 = mainBannerText1.current;
    const text2 = mainBannerText2.current;
    const text3 = mainBannerText3.current;
    const text4 = mainBannerText4.current;
    if (!videoWrapper || !video || !text1 || !text2 || !text3 || !text4) return;

    const texts = [text1, text2, text3, text4];
    // какие тексты видны на каждом шаге
    const STEPS = [[text1], [text1, text2], [text3], [text3, text4]];

    let step = 0;
    const secondPart = (s: number) => s >= 2;
    const showStep = (next: number) => {
      if (next === step) return;
      const prev = step;
      const forward = next > step;
      const leaving = STEPS[step].filter((text) => !STEPS[next].includes(text));
      const entering = STEPS[next].filter((text) => !STEPS[step].includes(text));
      step = next;

      if (secondPart(next) !== secondPart(prev)) {
        video.currentTime = secondPart(next) ? HERO_PART2_START : 0;
      }
      gsap.to(videoWrapper, {
        scale: secondPart(next) ? HERO_VIDEO_ZOOM : 1,
        duration: 0.9,
        ease: "power2.inOut",
        overwrite: "auto",
      });
      if (leaving.length) {
        gsap.to(leaving, {
          opacity: 0,
          y: forward ? -50 : 40,
          duration: 0.3,
          ease: "power2.in",
          overwrite: "auto",
        });
      }
      if (entering.length) {
        gsap.fromTo(
          entering,
          { opacity: 0, y: forward ? 40 : -50 },
          {
            opacity: 1,
            y: 0,
            duration: 0.45,
            // новый текст появляется, когда старый уже ушёл: тексты не накладываются
            delay: leaving.length ? 0.35 : 0,
            ease: "power3.out",
            overwrite: "auto",
          },
        );
      }
    };

    // страница могла открыться уже прокрученной — тогда сразу последний шаг
    const startStep = window.scrollY > 0 ? HERO_LAST_STEP : 0;
    gsap.set(texts, { opacity: 0, y: 40 });
    gsap.set(STEPS[startStep], { opacity: 1, y: 0 });
    step = startStep;
    gsap.set(videoWrapper, { scale: secondPart(step) ? HERO_VIDEO_ZOOM : 1 });
    if (secondPart(step)) video.currentTime = HERO_PART2_START;

    // ролик крутится только в своей части: первая с начала до HERO_PART1_END,
    // вторая с HERO_PART2_START до конца (loop у видео возвращает в 0 — переставляем).
    // Проверка идёт по кадрам только пока видео играет.
    let frame = 0;
    const keepPart = () => {
      frame = 0;
      if (video.paused) return;
      const time = video.currentTime;
      if (secondPart(step)) {
        if (time < HERO_PART2_START - 0.05) video.currentTime = HERO_PART2_START;
      } else if (time >= HERO_PART1_END) {
        video.currentTime = 0;
      }
      frame = requestAnimationFrame(keepPart);
    };
    const startKeepPart = () => {
      if (!frame) frame = requestAnimationFrame(keepPart);
    };
    video.addEventListener("play", startKeepPart);
    startKeepPart();

    const atTop = () => window.scrollY <= 1;
    // жест забирает первый экран, если страница наверху и шаг в эту сторону ещё есть
    const takes = (direction: number) =>
      atTop() && (direction > 0 ? step < HERO_LAST_STEP : step > 0);

    // Колесо и трекпад: шаг на первое событие жеста, дальше жест (с инерцией) только гасится
    let gestureTaken = false;
    let lockedUntil = 0;
    let lastWheel = 0;
    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) < Math.abs(event.deltaX)) return;
      const now = performance.now();
      const newGesture = now - lastWheel > HERO_GESTURE_GAP_MS && now > lockedUntil;
      lastWheel = now;
      const direction = Math.sign(event.deltaY);

      if (newGesture) {
        gestureTaken = takes(direction);
        if (gestureTaken) {
          showStep(step + direction);
          lockedUntil = now + HERO_STEP_LOCK_MS;
        }
      }
      if (gestureTaken && atTop()) event.preventDefault();
    };

    // Палец: шаг по окончании свайпа, страницу в это время не двигаем
    let touchStartY: number | null = null;
    let touchTaken = false;
    // решение принимается один раз на свайп: если страница доехала до верха посреди
    // прокрутки, этот же свайп шаг не переключает
    let touchDecided = false;
    const onTouchStart = (event: TouchEvent) => {
      touchStartY = event.touches[0]?.clientY ?? null;
      touchTaken = false;
      touchDecided = false;
    };
    const onTouchMove = (event: TouchEvent) => {
      if (touchStartY === null || !event.touches[0]) return;
      const dy = touchStartY - event.touches[0].clientY;
      if (!touchDecided && Math.abs(dy) > 4) {
        touchDecided = true;
        touchTaken = takes(Math.sign(dy));
      }
      if (touchTaken && event.cancelable) event.preventDefault();
    };
    const onTouchEnd = (event: TouchEvent) => {
      if (touchStartY === null) return;
      const dy = touchStartY - (event.changedTouches[0]?.clientY ?? touchStartY);
      touchStartY = null;
      if (touchTaken && Math.abs(dy) >= HERO_SWIPE_PX) showStep(step + Math.sign(dy));
      touchTaken = false;
    };

    // ушли с первого экрана не жестом (полоса прокрутки, клавиши, якорь) — показываем последний шаг
    const onScroll = () => {
      if (!atTop() && step < HERO_LAST_STEP) showStep(HERO_LAST_STEP);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("touchcancel", onTouchEnd);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
      video.removeEventListener("play", startKeepPart);
      gsap.killTweensOf([videoWrapper, ...texts]);
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
      <div className="main-banner-pin-wrapper">
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

          <div className="main-banner-button-wrapper">
            <MainBannerButton />
          </div>
        </div>
      </div>
    </div>
  );
};

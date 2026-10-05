"use client";

import { FONT_IBM_PLEX_SERIF_ITALIC, FONT_MONT_BOOK } from "../../fonts";
import { MainBannerButton } from "./main-banner-button";
import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";

import "./main-banner.css";
import { NBSP } from "@/app/constants";

const ANIMATION_SPEED_FACTOR = 1.1;
const SNAP_ZONE_START = 0.35; // 35% — конец text1/text2
const SNAP_ZONE_END = 0.4; // 40% — появление text3
const SNAP_IDLE_MS = 150; // сколько ждать после остановки скролла
const SNAP_DURATION = 0.4; // длительность докручивания

export const MainBanner = () => {
  const [windowHeight, setWindowHeight] = useState(0);
  const [windowWidth, setWindowWidth] = useState(0);

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

  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);
  const textAnimationsRef = useRef<ScrollTrigger[]>([]);
  const videoScaleAnimationRef = useRef<ScrollTrigger | null>(null);
  const isVideoScaledRef = useRef(false);

  // Для snap-логики
  const scrollDistanceRef = useRef(0);
  const idleTimerRef = useRef<number | null>(null);
  const isSnappingRef = useRef(false);
  const scrollTweenRef = useRef<gsap.core.Tween | null>(null);

  const animateIn = useCallback((element: HTMLElement | null) => {
    if (!element) return;
    gsap.killTweensOf(element);
    gsap.to(element, {
      opacity: 1,
      y: 0,
      duration: 0.5,
      ease: "power3.out",
      overwrite: "auto",
    });
  }, []);

  const animateOut = useCallback(
    (element: HTMLElement | null, direction: "up" | "down" = "up") => {
      if (!element) return;
      gsap.killTweensOf(element);
      gsap.to(element, {
        opacity: 0,
        y: direction === "up" ? -30 : 30,
        duration: 0.5,
        ease: "power3.in",
        overwrite: "auto",
      });
    },
    [],
  );

  // Размеры окна — только при смене breakpoint + ориентации
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 1024px)");

    const updateSizes = () => {
      setWindowHeight(window.innerHeight);
      setWindowWidth(window.innerWidth);
    };

    const handleBreakpointChange = () => updateSizes();

    updateSizes();

    mql.addEventListener("change", handleBreakpointChange);
    window.addEventListener("orientationchange", handleBreakpointChange);

    return () => {
      mql.removeEventListener("change", handleBreakpointChange);
      window.removeEventListener("orientationchange", handleBreakpointChange);
    };
  }, []);

  // Появление первого текста при загрузке
  useEffect(() => {
    if (!mainBannerText1.current) return;

    gsap.set(mainBannerText1.current, { opacity: 0, y: 30 });
    gsap.to(mainBannerText1.current, {
      opacity: 1,
      y: 0,
      duration: 0.5,
      delay: 0.5,
      ease: "power3.out",
    });
  }, []);

  // ============================================================
  // Snap-логика: если остановились между 35% и 40% — докрутить до 40%
  // ============================================================
  const setupSnapLogic = useCallback(() => {
    const section = sectionRef.current;
    if (!section) return () => {};

    const handleScroll = () => {
      // Если уже едем — игнорируем
      if (isSnappingRef.current) return;

      if (idleTimerRef.current !== null) {
        window.clearTimeout(idleTimerRef.current);
      }

      idleTimerRef.current = window.setTimeout(() => {
        const sectionTop = section.offsetTop;
        const scrollDistance = scrollDistanceRef.current;
        if (!scrollDistance) return;

        const scrollY = window.scrollY;
        const progress = (scrollY - sectionTop) / scrollDistance;

        // Попали в промежуток 35–40% — докрутить до 40%
        if (progress >= SNAP_ZONE_START && progress < SNAP_ZONE_END) {
          const targetY = sectionTop + scrollDistance * SNAP_ZONE_END;

          isSnappingRef.current = true;

          // Убиваем возможный предыдущий твин
          if (scrollTweenRef.current) {
            scrollTweenRef.current.kill();
            scrollTweenRef.current = null;
          }

          scrollTweenRef.current = gsap.to(window, {
            scrollTo: { y: targetY, autoKill: false },
            duration: SNAP_DURATION,
            ease: "power2.out",
            onComplete: () => {
              isSnappingRef.current = false;
              scrollTweenRef.current = null;
            },
          });
        }
      }, SNAP_IDLE_MS);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (idleTimerRef.current !== null) {
        window.clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      if (scrollTweenRef.current) {
        scrollTweenRef.current.kill();
        scrollTweenRef.current = null;
      }
      isSnappingRef.current = false;
    };
  }, []);

  const setupTextAnimations = useCallback(() => {
    textAnimationsRef.current.forEach((animation) => animation.kill());
    textAnimationsRef.current = [];

    const section = sectionRef.current;
    if (!section) return;

    if (mainBannerText1.current) {
      gsap.set(mainBannerText1.current, { opacity: 1, y: 0 });
    }

    [
      mainBannerText2.current,
      mainBannerText3.current,
      mainBannerText4.current,
    ].forEach((el) => {
      if (!el) return;
      gsap.killTweensOf(el);
      gsap.set(el, { opacity: 0, y: 30 });
    });

    // text1 — без onLeaveBack (ваша логика)
    if (mainBannerText1.current) {
      const animation1 = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "top+=35% top",
        refreshPriority: 0,
        onEnter: () => animateIn(mainBannerText1.current),
        onLeave: () => animateOut(mainBannerText1.current, "up"),
        onEnterBack: () => animateIn(mainBannerText1.current),
      });
      textAnimationsRef.current.push(animation1);
    }

    // text2 — все четыре колбэка (ваша логика)
    if (mainBannerText2.current) {
      const animation2 = ScrollTrigger.create({
        trigger: section,
        start: "top+=10% top",
        end: "top+=35% top",
        refreshPriority: 0,
        onEnter: () => animateIn(mainBannerText2.current),
        onLeave: () => animateOut(mainBannerText2.current, "up"),
        onEnterBack: () => animateIn(mainBannerText2.current),
        onLeaveBack: () => animateOut(mainBannerText2.current, "down"),
      });
      textAnimationsRef.current.push(animation2);
    }

    // text3 и text4 — появление без ухода (ваша логика)
    const otherElements = [
      { element: mainBannerText3.current, percent: 40 },
      { element: mainBannerText4.current, percent: 65 },
    ];

    otherElements.forEach(({ element, percent }) => {
      if (!element) return;

      const animation = ScrollTrigger.create({
        trigger: section,
        start: `top+=${percent}% top`,
        end: `top+=${percent + 5}% top`,
        refreshPriority: 0,
        onEnter: () => animateIn(element),
        onLeaveBack: () => animateOut(element, "down"),
      });

      textAnimationsRef.current.push(animation);
    });
  }, [animateIn, animateOut]);

  const setupVideoScaleAnimation = useCallback(() => {
    if (videoScaleAnimationRef.current) {
      videoScaleAnimationRef.current.kill();
      videoScaleAnimationRef.current = null;
    }

    const section = sectionRef.current;
    const videoWrapper = videoWrapperRef.current;
    if (!section || !videoWrapper) return;

    const currentScale = Number(gsap.getProperty(videoWrapper, "scale")) || 1;
    isVideoScaledRef.current = currentScale > 1.01;

    const st = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom bottom",
      invalidateOnRefresh: true,
      refreshPriority: 0,
      onUpdate: (self) => {
        const shouldScale = self.progress >= 0.45;

        if (shouldScale === isVideoScaledRef.current) return;

        isVideoScaledRef.current = shouldScale;
        gsap.killTweensOf(videoWrapper);
        gsap.to(videoWrapper, {
          scale: shouldScale ? 1.5 : 1,
          duration: 0.8,
          ease: "power2.out",
          overwrite: "auto",
        });
      },
    });

    videoScaleAnimationRef.current = st;
  }, []);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

    const section = sectionRef.current;
    const pin = pinRef.current;
    const videoWrapper = videoWrapperRef.current;

    if (!section || !pin || !videoWrapper || !windowHeight) return;

    const isMobile = windowWidth <= 1024;
    const scrollDistance = isMobile ? 4000 * ANIMATION_SPEED_FACTOR : 5000;

    // Запоминаем для snap-логики
    scrollDistanceRef.current = scrollDistance;

    section.style.minHeight = `${scrollDistance + windowHeight}px`;

    if (scrollTriggerRef.current) {
      scrollTriggerRef.current.kill();
      scrollTriggerRef.current = null;
    }

    scrollTriggerRef.current = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: `+=${scrollDistance}`,
      scrub: true,
      pin: pin,
      pinSpacing: false,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      refreshPriority: 0,
    });

    setupTextAnimations();
    setupVideoScaleAnimation();

    // Запускаем snap-логику
    const cleanupSnap = setupSnapLogic();

    return () => {
      cleanupSnap();

      if (scrollTriggerRef.current) {
        scrollTriggerRef.current.kill();
        scrollTriggerRef.current = null;
      }
      if (videoScaleAnimationRef.current) {
        videoScaleAnimationRef.current.kill();
        videoScaleAnimationRef.current = null;
      }
      textAnimationsRef.current.forEach((animation) => animation.kill());
      textAnimationsRef.current = [];
    };
  }, [
    windowHeight,
    windowWidth,
    setupTextAnimations,
    setupVideoScaleAnimation,
    setupSnapLogic,
  ]);

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

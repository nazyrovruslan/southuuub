"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import "./our-projects-scrollable-block.css";
import { getOurProjectItems } from "./constants";
import { FONT_MONT_BOOK } from "@/app/fonts";
import { Button } from "antd";
import { ImageWithFallback } from "@/app/components/image-with-fallback";
import { useGetLinkWithUtm } from "@/app/hooks/use-get-link-with-utm";

export const OurProjectsScrollableBlock = () => {
  const getLinkWIthUtm = useGetLinkWithUtm();

  const containerRef = useRef<HTMLDivElement>(null);
  const rightColumnRef = useRef<HTMLDivElement>(null);
  const leftColumnRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const mobileAnimationRef = useRef<gsap.core.Timeline | null>(null);
  const scrollTriggersRef = useRef<ScrollTrigger[]>([]);

  const ITEMS = useMemo(
    () => getOurProjectItems(getLinkWIthUtm),
    [getLinkWIthUtm],
  );

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const mql = window.matchMedia("(max-width: 1024px)");

    const handleMqlChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches);
    };

    handleMqlChange(mql);
    mql.addEventListener("change", handleMqlChange);

    return () => {
      mql.removeEventListener("change", handleMqlChange);
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const rightColumn = rightColumnRef.current;

    if (!container || !rightColumn) return;

    // Scoped-поиск внутри компонента, а не по всему документу
    const imgWrappers = container.querySelectorAll<HTMLElement>(
      ".our-projects-item-right-img-wrapper",
    );
    const imgs = gsap.utils.toArray<HTMLImageElement>(
      container.querySelectorAll(".our-projects-item-right-img"),
    );
    const infoSections = gsap.utils.toArray<HTMLElement>(
      container.querySelectorAll(".our-projects-item-left-info"),
    );

    imgWrappers.forEach((wrapper, index) => {
      const reverseIndex = imgWrappers.length - index;
      wrapper.setAttribute("data-index", String(reverseIndex));
      wrapper.style.zIndex = String(reverseIndex);
    });

    // Очистка предыдущих триггеров
    scrollTriggersRef.current.forEach((trigger) => trigger.kill());
    scrollTriggersRef.current = [];

    if (mobileAnimationRef.current) {
      mobileAnimationRef.current.kill();
      mobileAnimationRef.current = null;
    }

    // Сброс inline-стилей перед новым сетапом
    if (rightColumn) {
      rightColumn.removeAttribute("style");
      rightColumn.style.height = "";
      rightColumn.style.marginTop = "";
    }
    imgs.forEach((img) => {
      if (img?.style) img.removeAttribute("style");
    });

    const updateHeaderVisibility = (isPinned: boolean) => {
      const header = document.getElementById("header");
      if (!header) return;

      header.style.opacity = isPinned ? "0" : "1";
      header.style.transition = "opacity 0.3s ease";
      header.style.pointerEvents = isPinned ? "none" : "auto";
    };

    if (!isMobile) {
      // ============ DESKTOP ============
      rightColumn.classList.remove("mobile");
      rightColumn.classList.add("desktop");

      const mainTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: ".our-projects-scrollable-block",
          start: "top top",
          end: "bottom bottom",
          pin: ".our-projects-item-right",
          scrub: true,
          invalidateOnRefresh: true,
          anticipatePin: 1,
          refreshPriority: 1, // MainBanner = 0
        },
      });

      if (mainTimeline.scrollTrigger) {
        scrollTriggersRef.current.push(mainTimeline.scrollTrigger);
      }

      gsap.set(imgs, {
        clearProps: "clipPath,objectPosition,objectFit,transform,willChange",
      });

      gsap.set(imgs, {
        clipPath: "inset(0% 0% 0% 0%)",
        objectPosition: "0px 0%",
        objectFit: "cover",
        force3D: true,
      });

      imgs.forEach((_, index) => {
        const currentImage = imgs[index];
        const nextImage = imgs[index + 1] ? imgs[index + 1] : null;

        const sectionTimeline = gsap.timeline();

        if (nextImage) {
          sectionTimeline
            .to(
              currentImage,
              {
                clipPath: "inset(0% 0% 100% 0%)",
                objectPosition: "0px 60%",
                duration: 1.5,
                ease: "none",
              },
              0,
            )
            .to(
              nextImage,
              {
                objectPosition: "0px 40%",
                duration: 1.5,
                ease: "none",
              },
              0,
            );
        }

        mainTimeline.add(sectionTimeline);
      });
    } else {
      // ============ MOBILE ============
      rightColumn.style.height = "275px";
      rightColumn.style.marginTop = "72px";

      rightColumn.classList.remove("desktop");
      rightColumn.classList.add("mobile");

      gsap.set(imgs, {
        clearProps: "clipPath,objectPosition,objectFit,transform,willChange",
      });

      gsap.set(imgs, {
        willChange: "clip-path",
        force3D: true,
        objectFit: "cover",
        objectPosition: "center center",
      });

      const mobileTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: ".our-projects-scrollable-block",
          start: "top top",
          end: "bottom bottom",
          scrub: 0.3,
          pin: ".our-projects-item-right",
          pinSpacing: false,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          refreshPriority: 1,
        },
      });

      if (mobileTimeline.scrollTrigger) {
        scrollTriggersRef.current.push(mobileTimeline.scrollTrigger);
      }

      imgs.forEach((img, index) => {
        if (index === 0) {
          gsap.set(img, {
            clipPath: "inset(0% 0% 0% 0%)",
            objectPosition: "center 50%",
          });
        } else {
          gsap.set(img, {
            clipPath: "inset(100% 0% 0% 0%)",
            objectPosition: "center 50%",
          });
        }
      });

      const sectionDuration = 1 / infoSections.length;

      for (let i = 0; i < imgs.length - 1; i++) {
        const currentImg = imgs[i];
        const nextImg = imgs[i + 1];
        const startPosition = i * sectionDuration;

        mobileTimeline.to(
          currentImg,
          {
            clipPath: "inset(0% 0% 100% 0%)",
            objectPosition: "center 70%",
            duration: sectionDuration * 0.8,
            ease: "none",
          },
          startPosition + sectionDuration * 0.1,
        );

        mobileTimeline.fromTo(
          nextImg,
          {
            clipPath: "inset(100% 0% 0% 0%)",
            objectPosition: "center 30%",
          },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            objectPosition: "center 50%",
            duration: sectionDuration * 0.8,
            ease: "none",
          },
          startPosition + sectionDuration * 0.1,
        );
      }

      mobileAnimationRef.current = mobileTimeline;
    }

    const boundaryTrigger = ScrollTrigger.create({
      trigger: ".our-projects-scrollable-block",
      start: "top 70px",
      end: "bottom top",
      refreshPriority: 1,
      onEnter: () => updateHeaderVisibility(true),
      onLeave: () => updateHeaderVisibility(false),
      onEnterBack: () => updateHeaderVisibility(true),
      onLeaveBack: () => updateHeaderVisibility(false),
    });

    scrollTriggersRef.current.push(boundaryTrigger);

    return () => {
      scrollTriggersRef.current.forEach((trigger) => trigger.kill());
      scrollTriggersRef.current = [];

      if (mobileAnimationRef.current) {
        mobileAnimationRef.current.kill();
        mobileAnimationRef.current = null;
      }

      const header = document.getElementById("header");
      if (header) {
        header.style.opacity = "1";
        header.style.pointerEvents = "auto";
      }
    };
  }, [isMobile]);

  return (
    <div
      className="our-projects-scrollable-block-wrapper"
      ref={containerRef}
      id="our-projects-block"
    >
      <div className="our-projects-scrollable-block">
        {/* Левая колонка - текст */}
        <div className="our-projects-item-left" ref={leftColumnRef}>
          {ITEMS.map((item) => (
            <div
              key={item.id}
              className="our-projects-item-left-info"
              id={item.id}
            >
              <h2
                className={`${FONT_MONT_BOOK.className} our-projects-item-left-info-title`}
              >
                {item.title}
              </h2>
              <p
                className={`${FONT_MONT_BOOK.className} our-projects-item-left-info-description`}
              >
                {item.description}
              </p>
              <Button
                id={`btn_lending_${item.id}`}
                className={`our-projects-item-left-info-button base-button`}
                onClick={item.onClick}
                type="primary"
              >
                <span className={`${FONT_MONT_BOOK.className}`}>
                  {item.buttonTitle}
                </span>
              </Button>
            </div>
          ))}
        </div>

        {/* Правая колонка - картинки */}
        <div className="our-projects-item-right" ref={rightColumnRef}>
          <h2
            className={`${FONT_MONT_BOOK.className} our-projects-item-right-title`}
          >
            где встречаемся
          </h2>

          {ITEMS.map((item) => (
            <div
              key={`img-${item.id}`}
              className="our-projects-item-right-img-wrapper"
              // data-index ставится в useEffect — единый источник истины
            >
              {item.imageSrc && (
                <ImageWithFallback
                  src={item.imageSrc}
                  altSrc={item.altSrc!}
                  alt={item.imageAlt}
                  width={isMobile ? 612 : 900}
                  height={isMobile ? 275 : 536}
                  className="our-projects-item-right-img"
                />
              )}
              {item.videoSrc && (
                <video
                  className="our-projects-item-right-img"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  id={item.videoId}
                  disableRemotePlayback
                >
                  <source src={item.videoSrc} type="video/mp4" />
                </video>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

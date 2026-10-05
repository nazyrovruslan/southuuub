'use client';

import Image from 'next/image';
import { useRef, useEffect } from 'react';
import TelegaIcon from '../../../../public/v2/infinity-banner-tg.svg';
import LogoWhite from '../../../../public/v2/header-logo-white.svg';

import './infinity-banner.css';
import { FONT_MONT_BOOK } from '@/app/fonts';
import { TELEGRAM_CHANELL_LINK } from '@/app/constants';
import { useGetLinkWithUtm } from '@/app/hooks/use-get-link-with-utm';

const Item = () => (
  <div className="infinity-banner-item">
    <Image src={TelegaIcon} alt="telegramm-icon" height={36} width={36}
      className="infinity-banner-tg" unoptimized />
    <Image src={LogoWhite} alt="southuub" width={220} height={24}
      className="infinity-banner-logo" unoptimized />
    <p className={`${FONT_MONT_BOOK.className} infinity-banner-text`}>
      Все инсайты и новости ближе, чем вы думаете
    </p>
    <Image src={TelegaIcon} alt="telegramm-icon" height={36} width={36}
      className="infinity-banner-tg" unoptimized />
    <Image src={LogoWhite} alt="southuub" width={220} height={24}
      className="infinity-banner-logo" unoptimized />
    <p className={`${FONT_MONT_BOOK.className} infinity-banner-text`}>
      подпишитесь, чтобы оставаться на связи
    </p>
  </div>
);

export const InfinityBanner = () => {
  const getLinkWithUtm = useGetLinkWithUtm();
  const trackRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const currentOffsetRef = useRef(0);
  const lastTimeRef = useRef(0);
  const isPausedRef = useRef(false);
  // Полоса стоит, пока её не видно, и начинает ехать, когда появляется на экране
  const isVisibleRef = useRef(false);

  const SPEED = 80;

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const trackWidth = track.scrollWidth / 2;

    function animate(timestamp: number) {
      if (!isPausedRef.current && isVisibleRef.current) {
        if (lastTimeRef.current === 0) {
          lastTimeRef.current = timestamp;
        }

        const delta = (timestamp - lastTimeRef.current) / 1000;
        currentOffsetRef.current += delta * SPEED;
        currentOffsetRef.current %= trackWidth;

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        track.style.transform = `translateX(-${currentOffsetRef.current}px)`;
        lastTimeRef.current = timestamp;
      } else {
        lastTimeRef.current = 0;
      }

      animationRef.current = requestAnimationFrame(animate);
    }

    const start = () => {
      if (!animationRef.current) animationRef.current = requestAnimationFrame(animate);
    };
    const stop = () => {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = 0;
      lastTimeRef.current = 0;
    };

    const observer = new IntersectionObserver(([entry]) => {
      isVisibleRef.current = entry.isIntersecting;
      if (entry.isIntersecting) start();
      else stop();
    });
    observer.observe(track);

    return () => {
      observer.disconnect();
      stop();
    };
  }, []);

  const handleMouseEnter = () => {
    isPausedRef.current = true;
  };

  const handleMouseLeave = () => {
    isPausedRef.current = false;
  };

  return (
    <a
      id="btn_lending_infinity_banner"
      className="infinity-banner-wrapper"
      href={getLinkWithUtm(TELEGRAM_CHANELL_LINK)}
      target="_blank"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="infinity-banner-track">
        <div className="infinity-banner-items" ref={trackRef}>
          <Item />
          <Item />
          <Item />
          <Item />
          <Item />
          <Item />
          <Item />
          <Item />
        </div>
      </div>
    </a>
  );
};
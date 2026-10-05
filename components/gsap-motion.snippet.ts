// GSAP: анимации только для тех, кто не просил уменьшить движение,
// и без закрепления секции «где встречаемся» на узких экранах (там остаётся пустота).
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

export function setupMotion(section: HTMLElement, pinTarget: HTMLElement) {
  const mm = gsap.matchMedia();

  mm.add(
    {
      desktop: '(min-width: 1025px) and (prefers-reduced-motion: no-preference)',
      compact: '(max-width: 1024px) and (prefers-reduced-motion: no-preference)',
      reduce: '(prefers-reduced-motion: reduce)',
    },
    ctx => {
      const { desktop, compact, reduce } = ctx.conditions!;
      if (reduce) return; // статичная вёрстка, без pin и scrub

      ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: desktop ? '+=5000' : '+=0',
        pin: desktop ? pinTarget : false, // на телефонах и планшетах секция идёт обычным потоком
        scrub: true,
        invalidateOnRefresh: true,
      });

      if (compact) {
        // лёгкое появление вместо закрепления
        gsap.from(pinTarget.querySelectorAll('img, video'), {
          opacity: 0, y: 40, duration: .6, stagger: .1,
          scrollTrigger: { trigger: section, start: 'top 80%' },
        });
      }
    },
  );

  return () => mm.revert();
}

// Ошибка «Failed to execute 'scrollTo' on 'Window'»: перед любым scrollTo проверять число.
export const safeScrollTo = (y: number) => {
  if (Number.isFinite(y)) window.scrollTo({ top: y });
};

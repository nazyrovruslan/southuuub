'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

type Props = {
  text: string;
  className: string;
  delay?: number;
}

let isScrollTriggerRegistered = false;

const DURATION = 1;
const Y = 100;
const START = 'top 85%';
const END = 'top 50%';
const ONCE = true;

export const AnimateTitle = ({
  text,
  className,
  delay = 0.3,
}: Props) => {
  const textRef = useRef<HTMLHeadingElement>(null);
  const animationId = useRef<number | null>(null);

  useEffect(() => {
    // Регистрируем ScrollTrigger один раз
    if (!isScrollTriggerRegistered) {
      gsap.registerPlugin(ScrollTrigger);
      isScrollTriggerRegistered = true;
    }

    if (!textRef.current) return;

    // Очищаем предыдущую анимацию
    if (animationId.current) {
      gsap.killTweensOf(textRef.current);
      
      // Убиваем связанный ScrollTrigger
      const triggers = ScrollTrigger.getAll();
      triggers.forEach(trigger => {
        if (trigger.trigger === textRef.current) {
          trigger.kill();
        }
      });
    }

    // Устанавливаем начальное состояние
    gsap.set(textRef.current, {
      y: Y,
      opacity: 0,
    });

    setTimeout(() => gsap.to(textRef.current, {
        y: 0,
        opacity: 1,
        duration: DURATION,
        delay,
        ease: 'power3.out',
        scrollTrigger: {
            trigger: textRef.current,
            start: START,
            end: END,
            toggleActions: ONCE
            ? 'play none none none'
            : 'play none reverse none',
            once: ONCE,
            // Важно: идентификатор для легкой очистки
            id: `animate-title-${Math.random().toString(36).substr(2, 9)}`,
        }
    }), 0);

    // Очистка
    return () => {
      if (textRef.current) {
        gsap.killTweensOf(textRef.current);
      }

      // Находим и убиваем именно наш ScrollTrigger
      if (animationId.current && typeof animationId.current === 'string') {
        const trigger = ScrollTrigger.getById(animationId.current as string);
        if (trigger) {
          trigger.kill();
        }
      }
    };
  }, [text, delay]);

  return (
    <h2 ref={textRef} className={className} style={{ opacity: 0 }}>
      {text}
    </h2>
  );
};
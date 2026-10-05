'use client';
import { useEffect } from 'react';

// Ставит .header--scrolled после 10px прокрутки (см. styles/fixes.css, пункт 3).
export function useHeaderScrolled(selector = '.header') {
  useEffect(() => {
    const header = document.querySelector<HTMLElement>(selector);
    if (!header) return;
    const onScroll = () => header.classList.toggle('header--scrolled', window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [selector]);
}

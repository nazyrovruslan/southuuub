'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FONT_MONT_BOOK } from '@/app/fonts';
import './accordions-block.css';
import Image from 'next/image';
import AccordionPlus from '../../../../public/accordion-plus.svg';

gsap.registerPlugin(ScrollTrigger);

const ITEMS = [
    {
        key: '1',
        label: 'Баланс',
        children: `верим, что успех и эффективность руководителя строятся на балансе профессиональных связей, семьи, саморазвития, обучения и физической формы`,
    },
    {
        key: '2',
        label: `Совместное развитие`,
        children: `создаём пространство, в котором комфортно расти и вдохновлять других, влиять на развитие бизнеса и всей IT-индустрии`,
    },
    {
        key: '3',
        label: 'Безопасная среда',
        children: `строим тёплое сообщество равных, где поддержка важнее регалий, юмор — часть культуры, а доверие и открытость позволяют вести честные разговоры`,
    },
    {
        key: '4',
        label: 'Со-создание',
        children: `любая активность сообщества рождается из энергии участников: идей, опыта, запросов и инициатив. здесь созидают вместе — а значит, по-настоящему`,
    },
];

export const AccordionsBlock = () => {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const firstItemRef = useRef<HTMLDivElement>(null);
    const contentRefs = useRef<(HTMLDivElement | null)[]>([]);
    const iconRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        const header = document.querySelector('#header');
        const targetBlock = document.querySelector('#accordions-block');
        
        if (!header || !targetBlock) return;

        let lastScrollY = window.scrollY;
        let isHeaderBlack = false;

        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            const blockRect = targetBlock.getBoundingClientRect();
            const blockTop = blockRect.top - 70;
            const isScrollingUp = currentScrollY < lastScrollY;
    
            if (blockTop <= 0) {
                if (!isHeaderBlack) {
                    header.classList.add('header_black');
                    isHeaderBlack = true;
                }
            } 
            else if (isScrollingUp && blockTop <= 70) {
                if (!isHeaderBlack) {
                    header.classList.add('header_black');
                    isHeaderBlack = true;
                }
            } else {
                if (isHeaderBlack) {
                    header.classList.remove('header_black');
                    isHeaderBlack = false;
                }
            }
        
            lastScrollY = currentScrollY;
        };

        window.addEventListener('scroll', handleScroll);
        
        handleScroll();

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    useEffect(() => {
        const wrapper = wrapperRef.current;
        if (!wrapper) return;

        const contents = contentRefs.current.filter(Boolean) as HTMLDivElement[];
        const icons = iconRefs.current.filter(Boolean) as HTMLDivElement[];
        if (contents.length === 0) return;

        const heights = contents.map((el) => el.offsetHeight);
        const totalHeight = heights.reduce((sum, h) => sum + h, 0);

        const spacer = document.createElement('div');
        spacer.style.height = `${totalHeight}px`;
        wrapper.parentNode?.insertBefore(spacer, wrapper.nextSibling);

        contents.forEach((el, i) => gsap.set(el, { height: heights[i], overflow: 'hidden' }));
        gsap.set(icons, { rotation: 45 });

        let rafId: number | null = null;

        const ctx = gsap.context(() => {
            const tl = gsap.timeline();

            heights.forEach((h, i) => {
            tl.to(contents[i], { height: 0, ease: 'none', duration: h });
            tl.to(icons[i], { rotation: 0, ease: 'none', duration: h }, '<');
            });

            ScrollTrigger.create({
            trigger: firstItemRef.current,
            start: 'top 130px',
            end: () => `+=${totalHeight}`,
            pin: wrapper,
            pinSpacing: false,
            scrub: 1,
            animation: tl,
            // ❌ Убираем invalidateOnRefresh, чтобы избежать рекурсии
            onUpdate: (self) => {
                const remainingHeight = totalHeight * (1 - self.progress);
                spacer.style.height = `${remainingHeight}px`;

                // Троттлинг вызова refresh
                if (rafId) cancelAnimationFrame(rafId);
                rafId = requestAnimationFrame(() => {
                ScrollTrigger.refresh();
                rafId = null;
                });
            },
            });
        }, wrapper);

        return () => {
            ctx.revert();
            spacer.remove();
            if (rafId) cancelAnimationFrame(rafId);
        };
    }, []);

    return (
        <div
            ref={wrapperRef}
            className='accordions-block-wrapper'
            id='accordions-block'
        >
            <div className={`${FONT_MONT_BOOK.className} accordions-block-title`}>
                наши ценности
            </div>

            <div className='accordions-block-list'>
                {ITEMS.map((item, index) => (
                    <div key={item.key} ref={index === 0 ? firstItemRef : undefined} className='accordion-item'>
                        <div className={`accordion-header ${index === 0 ? 'accordion-header--first' : ''}`}>
                            <p className={`${FONT_MONT_BOOK.className} accordions-block-label`}>{item.label}</p>

                            <div ref={(el) => { iconRefs.current[index] = el }} className='accordion-icon'>
                                <Image
                                    src={AccordionPlus}
                                    alt="accordion-plus"
                                    width={47}
                                    height={47}
                                    unoptimized
                                />
                            </div>
                        </div>

                        <div ref={(el) => { contentRefs.current[index] = el }} className='accordion-content'>
                            <div className='accordion-content-inner'>
                                <p className={`${FONT_MONT_BOOK.className} accordions-block-children`}>{item.children}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

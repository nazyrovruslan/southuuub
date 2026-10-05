'use client';

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import Image from 'next/image';

import { IconS, IconO, IconU, IconT, IconH, IconB } from './cell-desktop';

import SocietyPhoto1 from '../../../../public/v2/society/society-1.jpg';
import SocietyPhoto2 from '../../../../public/v2/society/society-2.jpg';
import SocietyPhoto3 from '../../../../public/v2/society/society-3.jpg';
import SocietyPhoto4 from '../../../../public/v2/society/society-4.jpg';
import SocietyPhoto5 from '../../../../public/v2/society/society-5.jpg';
import SocietyPhoto6 from '../../../../public/v2/society/society-6.jpg';
import SocietyPhoto7 from '../../../../public/v2/society/society-7.jpg';
import SocietyPhoto8 from '../../../../public/v2/society/society-8.jpg';
import SocietyPhoto9 from '../../../../public/v2/society/society-9.jpg';
import SocietyPhoto10 from '../../../../public/v2/society/society-10.jpg';
import SocietyPhoto11 from '../../../../public/v2/society/society-11.jpg';
import SocietyPhoto12 from '../../../../public/v2/society/society-12.jpg';
import SocietyPhoto13 from '../../../../public/v2/society/society-13.jpg';
import SocietyPhoto14 from '../../../../public/v2/society/society-14.jpg';

import './society-photos-block.css';
import { FONT_IBM_PLEX_SERIF_LIGHT, FONT_MONT_BOOK } from '@/app/fonts';
import { DESKTOP_CELL_POSITIONS, TABLET_CELL_POSITIONS, MOBILE_CELL_POSITIONS } from './cell-desktop';

type CellConfig = {
    x: number;
    y: number;
    type: string;
    src?: string;
    text?: string;
    colSpan?: number;
};

type Letter = {
    id: string;
    cell: CellConfig;
    isNew?: boolean;
    leaving?: boolean;
};

type Frame = {
    // Положение букв: 0 — заставка (ролик из первого экрана), 1–3 — для фотографий
    position: number;
    // Десктоп: фото слегка увеличено от края, чтобы лица ушли из клеток с буквами
    scale?: number;
    origin?: string;
};

// Кадр 0 — короткий ролик из видео первого экрана, дальше 14 фотографий.
// Положение и кадрирование подобраны под каждое фото, чтобы буквы не закрывали лица.
const FRAMES: Frame[] = [
    { position: 0 },
    { position: 1, scale: 1.14, origin: '100% 50%' },
    { position: 2 },
    { position: 1 },
    { position: 3, scale: 1.2, origin: '100% 15%' },
    { position: 1 },
    { position: 2, scale: 1.14, origin: '95% 15%' },
    { position: 3, scale: 1.3, origin: '40% 100%' },
    { position: 3 },
    { position: 1, scale: 1.14, origin: '100% 35%' },
    { position: 2, scale: 1.14, origin: '0% 60%' },
    { position: 1, scale: 1.2, origin: '100% 25%' },
    { position: 2, scale: 1.3, origin: '100% 15%' },
    { position: 1 },
    { position: 3 },
];

const PHOTOS = [
    SocietyPhoto1, SocietyPhoto2, SocietyPhoto3, SocietyPhoto4, SocietyPhoto5, SocietyPhoto6, SocietyPhoto7,
    SocietyPhoto8, SocietyPhoto9, SocietyPhoto10, SocietyPhoto11, SocietyPhoto12, SocietyPhoto13, SocietyPhoto14,
];

const PHOTO_DURATION_MS = 2000;
// Ролик длится 5 с; если событие ended не пришло (например, видео не загрузилось), кадр всё равно сменится
const CLIP_FALLBACK_MS = 6000;
const CLIP_POSTER = '/v2/society/society-clip-poster.jpg';

const getPositions = (device: string) => {
    if (device === 'tablet') return TABLET_CELL_POSITIONS as CellConfig[][];
    if (device === 'mobile') return MOBILE_CELL_POSITIONS as CellConfig[][];
    return DESKTOP_CELL_POSITIONS as CellConfig[][];
};

const letterKind = (cell: CellConfig) => cell.type === 'text' ? 'text' : cell.src ?? '';

// Каждая буква переезжает из своей клетки в новую: одинаковые буквы сопоставляются
// по ближайшему расстоянию, лишние плавно гаснут, недостающие проявляются на месте.
const placeLetters = (prev: Letter[], config: CellConfig[], nextId: () => string): Letter[] => {
    const pool = prev.filter(letter => !letter.leaving);
    const result: Letter[] = [];
    const kinds = new Set([...pool.map(l => letterKind(l.cell)), ...config.map(letterKind)]);

    kinds.forEach(kind => {
        const olds = pool.filter(l => letterKind(l.cell) === kind);
        const news = config.filter(cell => letterKind(cell) === kind);
        const pairs: [number, number, number][] = [];

        olds.forEach((old, i) => news.forEach((cell, j) => {
            pairs.push([Math.hypot(old.cell.x - cell.x, old.cell.y - cell.y), i, j]);
        }));
        pairs.sort((a, b) => a[0] - b[0]);

        const usedOld = new Set<number>();
        const usedNew = new Set<number>();

        pairs.forEach(([, i, j]) => {
            if (usedOld.has(i) || usedNew.has(j)) return;
            usedOld.add(i);
            usedNew.add(j);
            result.push({ id: olds[i].id, cell: news[j] });
        });

        news.forEach((cell, j) => {
            if (!usedNew.has(j)) result.push({ id: nextId(), cell, isNew: prev.length > 0 });
        });

        olds.forEach((old, i) => {
            if (!usedOld.has(i)) result.push({ ...old, isNew: false, leaving: true });
        });
    });

    return result;
};

const renderLetterContent = (cell: CellConfig) => (
    cell.type === 'text' ? (
        <div className={`text-cell ${FONT_MONT_BOOK.className}`}>
            {cell.text}
        </div>
    ) : (
        cell.src === 'WordS' && <IconS className='society-cell-img' /> ||
        cell.src === 'WordO' && <IconO className='society-cell-img' /> ||
        cell.src === 'WordU' && <IconU className='society-cell-img' /> ||
        cell.src === 'WordT' && <IconT className='society-cell-img' /> ||
        cell.src === 'WordH' && <IconH className='society-cell-img' /> ||
        cell.src === 'WordB' && <IconB className='society-cell-img' />
    )
);

/**
 * TODO
 * 1) Выравнять буквы, чтобы всегда были одинаковые по высоте
 */

/**
 * TODO после выкатки
 * 1) Динамическую сетку чтобы были квадратики
 * 2) На каждую картинку сделать колонку и при наведении переключать картинку
 * 3) Пока нет ховера у нас картинка заглушка на десктопе
 * 4) На планшетах и моболке карусель через горизонт свайп.
 * 5) На мобилке когда доезжаем до блока, происходит анимация их заглушки, буквы уезжают и появляется первыая картинка.
 */

export const SocietyPhotosBlock = () => {
    const [frame, setFrame] = useState(0);
    const [device, setDevice] = useState('desktop');
    const [isVisible, setIsVisible] = useState(false);
    const [clipSrc, setClipSrc] = useState<string | undefined>();
    const wrapperRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const idCounterRef = useRef(0);
    const nextId = useCallback(() => `letter-${idCounterRef.current++}`, []);
    const [letters, setLetters] = useState<Letter[]>(() => placeLetters([], DESKTOP_CELL_POSITIONS[0] as CellConfig[], nextId));

    useEffect(() => {
        const header = document.querySelector('#header');
        const targetBlock = document.querySelector('#society-photos-block');
        
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
                    header.classList.remove('header_black');
                    isHeaderBlack = true;
                }

                if (blockRect.bottom <= 70) {
                    header.classList.remove('header_hidden_logo');
                } else {
                    header.classList.add('header_hidden_logo');
                }
            } else if (isScrollingUp && blockTop <= 70) {
                if (!isHeaderBlack) {
                    header.classList.remove('header_black');
                    header.classList.add('header_hidden_logo');
                    isHeaderBlack = true;
                }
            } else {
                if (isHeaderBlack) {
                    header.classList.add('header_black');
                    header.classList.remove('header_hidden_logo');
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

    // Слайдшоу и ролик работают, только пока блок виден
    useEffect(() => {
        const wrapper = wrapperRef.current;
        if (!wrapper) return;

        const observer = new IntersectionObserver(([entry]) => {
            setIsVisible(entry.isIntersecting);
            if (entry.isIntersecting) {
                setClipSrc(src => src ?? (window.innerWidth * (window.devicePixelRatio || 1) > 1600
                    ? '/v2/society/society-clip-1920.mp4'
                    : '/v2/society/society-clip-1280.mp4'));
            }
        }, { rootMargin: '200px 0px' });

        observer.observe(wrapper);

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const video = videoRef.current;
        const next = () => setFrame(prev => (prev + 1) % FRAMES.length);

        if (frame !== 0) {
            video?.pause();
            if (!isVisible) return;
            const timeout = setTimeout(next, PHOTO_DURATION_MS);
            return () => clearTimeout(timeout);
        }

        if (!isVisible || !video || !clipSrc) {
            video?.pause();
            return;
        }

        video.currentTime = 0;
        video.play().catch(() => {});
        video.addEventListener('ended', next);
        const timeout = setTimeout(next, CLIP_FALLBACK_MS);

        return () => {
            video.removeEventListener('ended', next);
            clearTimeout(timeout);
        };
    }, [frame, isVisible, clipSrc]);

    useEffect(() => {
        const positions = getPositions(device);
        setLetters(prev => placeLetters(prev, positions[FRAMES[frame].position] ?? positions[0], nextId));
    }, [frame, device, nextId]);

    const rows = device === 'tablet' ? 6 : device === 'mobile' ? 9 : 5;
    const cols = device === 'tablet' ? 5 : device === 'mobile' ? 5 : 7;

    const renderGrid = useCallback(() => {
        const grid = [];
        const positions = getPositions(device);
        const config = positions[FRAMES[frame].position] ?? positions[0];

        // Клетки с colSpan (на мобилке текст занимает две клетки)
        const colSpanMap = new Map();

        config.forEach(cell => {
            if (cell.colSpan === 2) {
                colSpanMap.set(`${cell.x}-${cell.y}`, cell.colSpan);
                colSpanMap.set(`${cell.x + 1}-${cell.y}`, 'hidden');
            }
        });

        for (let y = 0; y < rows; y++) {
            const row = [];

            for (let x = 0; x < cols; x++) {
                const cellKey = `${x}-${y}`;
                const colSpanValue = colSpanMap.get(cellKey);

                if (colSpanValue === 'hidden') {
                    continue;
                }

                const flexWeight = colSpanValue === 2 ? 2 : 1;
                const showBorderRight = x < cols - 1 && colSpanValue !== 2;
                const showBorderBottom = y < rows - 1;

                row.push(
                    <div
                        key={cellKey}
                        className={`society-grid-cell ${!showBorderRight ? 'no-border-right' : ''} ${!showBorderBottom ? 'no-border-bottom' : ''}`}
                        style={{ flex: flexWeight }}
                    >
                        {frame > 0 && (
                            (device === 'desktop' && y === 4 && x === 3) ||
                            (device === 'tablet' && y === 5 && x === 2) ||
                            (device === 'mobile' && y === 8 && x === 2)
                        ) && (
                            <div className={`${FONT_IBM_PLEX_SERIF_LIGHT.className} cell-content-count`}>
                                {`${frame}/${PHOTOS.length}`}
                            </div>
                        )}
                    </div>
                );
            }

            grid.push(
                <div key={`row-${y}`} className='society-grid-row'>
                    {row}
                </div>
            );
        }

        return grid;
    }, [frame, device, rows, cols]);

    useEffect(() => {
        const getDevice = () => {
            const tablet = window.matchMedia("(max-width: 1024px)").matches;
            const mobile = window.matchMedia("(max-width: 767px)").matches;

            setDevice(mobile ? 'mobile' : tablet ? 'tablet' : 'desktop');
        }

        window.addEventListener('resize', getDevice);

        getDevice();

        return () => {
            window.removeEventListener('resize', getDevice);
        }
    }, []);

    return (
        <div className='society-photos-block-wrapper' id='society-photos-block' ref={wrapperRef}>
            <div className='society-photos-block-img-wrapper'>
                <video
                    ref={videoRef}
                    className={`society-photos-block-img society-photos-block-img-${frame === 0 ? 'visible' : 'hidden'}`}
                    src={clipSrc}
                    poster={CLIP_POSTER}
                    preload='none'
                    muted
                    playsInline
                    aria-hidden='true'
                />
                {PHOTOS.map((photo, i) => (
                    <Image
                        key={i}
                        src={photo}
                        sizes='100vw'
                        alt=''
                        className={`society-photos-block-img society-photos-block-img-${frame === i + 1 ? 'visible' : 'hidden'}`}
                        style={{
                            '--society-photo-scale': FRAMES[i + 1].scale ?? 1,
                            '--society-photo-origin': FRAMES[i + 1].origin ?? '50% 50%',
                        } as CSSProperties}
                    />
                ))}
            </div>

            <div className='society-photos-block-grid-wrapper'>
                {renderGrid()}

                <div className='society-letters'>
                    {letters.map(letter => {
                        const span = letter.cell.colSpan ?? 1;

                        return (
                            <div
                                key={letter.id}
                                data-span={span}
                                className={`society-letter ${letter.isNew ? 'entering' : ''} ${letter.leaving ? 'leaving' : ''}`}
                                style={{
                                    width: `${100 * span / cols}%`,
                                    height: `${100 / rows}%`,
                                    transform: `translate(${letter.cell.x * 100 / span}%, ${letter.cell.y * 100}%)`,
                                }}
                            >
                                <div className='cell-content'>
                                    {renderLetterContent(letter.cell)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

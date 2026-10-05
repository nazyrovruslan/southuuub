'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from 'react';
import Image from 'next/image';

import { IconS, IconO, IconU, IconT, IconH, IconB, DESKTOP_CELL_POSITIONS, TABLET_CELL_POSITIONS } from './cell-desktop';

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
import { MOBILE_FRAME_LAYOUTS, MOBILE_PHOTO_X } from './mobile-frames';

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
// Соседние кадры не сочетают положения 2 и 3, а 3 не стоит рядом с роликом: иначе какая-то
// буква сдвинулась бы больше чем на одну клетку.
const FRAMES: Frame[] = [
    { position: 0 },
    { position: 1, scale: 1.14, origin: '100% 50%' },
    { position: 2 },
    { position: 1 },
    { position: 3, scale: 1.2, origin: '100% 15%' },
    { position: 1 },
    { position: 1, scale: 1.14, origin: '100% 0%' },
    { position: 3, scale: 1.42, origin: '0% 100%' },
    { position: 3 },
    { position: 1, scale: 1.14, origin: '100% 35%' },
    { position: 2, scale: 1.14, origin: '0% 60%' },
    { position: 1, scale: 1.2, origin: '100% 25%' },
    { position: 2, scale: 1.3, origin: '100% 15%' },
    { position: 1 },
    { position: 1 },
];

const PHOTOS = [
    SocietyPhoto1, SocietyPhoto2, SocietyPhoto3, SocietyPhoto4, SocietyPhoto5, SocietyPhoto6, SocietyPhoto7,
    SocietyPhoto8, SocietyPhoto9, SocietyPhoto10, SocietyPhoto11, SocietyPhoto12, SocietyPhoto13, SocietyPhoto14,
];

const PHOTO_DURATION_MS = 2000;
// Ролик длится 5 с; если событие ended не пришло (например, видео не загрузилось), кадр всё равно сменится
const CLIP_FALLBACK_MS = 6000;
const CLIP_POSTER = '/v2/society/society-clip-poster.jpg';

// На телефоне у каждого кадра своя раскладка (mobile-frames.ts), на планшете и десктопе — одно из 4 положений
const getFrameLayout = (device: string, frame: number): CellConfig[] => {
    if (device === 'mobile') return MOBILE_FRAME_LAYOUTS[frame] as CellConfig[];
    const positions = (device === 'tablet' ? TABLET_CELL_POSITIONS : DESKTOP_CELL_POSITIONS) as CellConfig[][];
    return positions[FRAMES[frame].position] ?? positions[0];
};

// Свайп по нижнему ряду клеток листает кадры
const SWIPE_THRESHOLD_PX = 40;
// минимальный отрезок пути пальца на один кадр при перемотке
const SWIPE_MIN_STEP_PX = 24;
// смена кадра во время перемотки и сколько ждать после последнего шага, чтобы вернуть обычную анимацию
const SCRUB_MS = 160;
const SCRUB_IDLE_MS = 300;

const letterKind = (cell: CellConfig) => cell.type === 'text' ? 'text' : cell.src ?? '';

// Путь буквы в клетках по горизонтали плюс по вертикали: соседняя клетка — только сбоку, сверху или снизу
const distance = (a: CellConfig, b: CellConfig) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

// Сопоставление одинаковых букв так, чтобы самый дальний сдвиг был минимальным
// (для раскладок из cell-desktop он не больше одной клетки), а при равенстве — суммарный путь
const matchCells = (olds: CellConfig[], news: CellConfig[]): [number, number][] => {
    const swap = olds.length > news.length;
    const short = swap ? news : olds;
    const long = swap ? olds : news;
    let best: [number, number][] = [];
    let bestWorst = Infinity;
    let bestTotal = Infinity;

    const walk = (i: number, used: boolean[], pairs: [number, number][], worst: number, total: number) => {
        if (worst > bestWorst || (worst === bestWorst && total >= bestTotal)) return;
        if (i === short.length) {
            best = [...pairs];
            bestWorst = worst;
            bestTotal = total;
            return;
        }
        long.forEach((cell, j) => {
            if (used[j]) return;
            const d = distance(short[i], cell);
            used[j] = true;
            pairs.push(swap ? [j, i] : [i, j]);
            walk(i + 1, used, pairs, Math.max(worst, d), total + d);
            pairs.pop();
            used[j] = false;
        });
    };

    walk(0, long.map(() => false), [], 0, 0);
    return best;
};

// Каждая буква сдвигается из своей клетки не дальше соседней. Лишние гаснут на месте,
// недостающие проявляются. Текст не ездит: если его клетка сменилась, он гаснет
// на старом месте и проявляется на новом.
const placeLetters = (prev: Letter[], config: CellConfig[], nextId: () => string): Letter[] => {
    const pool = prev.filter(letter => !letter.leaving);
    const result: Letter[] = [];
    const kinds = new Set([...pool.map(l => letterKind(l.cell)), ...config.map(letterKind)]);

    kinds.forEach(kind => {
        const olds = pool.filter(l => letterKind(l.cell) === kind);
        const news = config.filter(cell => letterKind(cell) === kind);
        const usedOld = new Set<number>();
        const usedNew = new Set<number>();

        matchCells(olds.map(l => l.cell), news).forEach(([i, j]) => {
            const d = distance(olds[i].cell, news[j]);
            if (d > 1 || (kind === 'text' && d > 0)) return;
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

type Point = { x: number; y: number };

const EASINGS = [
    'cubic-bezier(0.65, 0, 0.35, 1)',
    'cubic-bezier(0.22, 1, 0.36, 1)',
    'cubic-bezier(0.83, 0, 0.17, 1)',
    'cubic-bezier(0.34, 1.3, 0.64, 1)',
];
// небольшой сдвиг при появлении и исчезновении: сбоку, сверху или снизу
const NUDGES: Point[] = [{ x: -0.35, y: 0 }, { x: 0.35, y: 0 }, { x: 0, y: -0.35 }, { x: 0, y: 0.35 }];

const random = (min: number, max: number) => min + Math.random() * (max - min);
const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];

const toTranslate = ({ x, y }: Point, span: number) => `translate(${x * 100 / span}%, ${y * 100}%)`;

// Смена кадра: буквы двигаются не строем, у каждой своя задержка, скорость и характер
// движения, но путь не дальше соседней клетки. Во время перемотки пальцем кадры сменяются
// быстро, поэтому движение короткое и без задержек, иначе буквы разных кадров наслаиваются.
const animateLetters = (letters: Letter[], prevPositions: Map<string, Point>, elements: Map<string, HTMLDivElement>, fast: boolean) => {
    const zero = { x: 0, y: 0 };

    letters.forEach(letter => {
        const element = elements.get(letter.id);
        const prev = prevPositions.get(letter.id);
        const cell = letter.cell;
        const span = cell.colSpan ?? 1;
        if (!element) return;

        // предыдущая анимация буквы обрывается, новая начинается с её клетки
        element.getAnimations().forEach(animation => animation.cancel());
        const delay = fast ? 0 : random(0, 400);

        if (letter.leaving) {
            if (!prev) return;
            element.animate(
                [{ transform: toTranslate(zero, span), opacity: 1 }, { transform: toTranslate(pick(NUDGES), span), opacity: 0 }],
                { duration: fast ? 1 : random(400, 600), delay: delay / 2, easing: 'ease-in', fill: 'forwards' },
            );
            return;
        }

        if (!prev) {
            if (!letter.isNew) return;
            element.animate(
                [{ transform: toTranslate(pick(NUDGES), span), opacity: 0 }, { transform: toTranslate(zero, span), opacity: 1 }],
                { duration: fast ? SCRUB_MS : random(500, 800), delay: fast ? 0 : delay + 350, easing: fast ? 'ease-out' : pick(EASINGS), fill: 'backwards' },
            );
            return;
        }

        if (prev.x === cell.x && prev.y === cell.y) return;

        element.animate(
            [{ transform: toTranslate({ x: prev.x - cell.x, y: prev.y - cell.y }, span) }, { transform: toTranslate(zero, span) }],
            { duration: fast ? SCRUB_MS : random(600, 1100), delay, easing: fast ? 'ease-out' : pick(EASINGS), fill: 'backwards' },
        );
    });
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
    const letterElementsRef = useRef(new Map<string, HTMLDivElement>());
    const letterPositionsRef = useRef(new Map<string, Point>());

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
        setLetters(prev => placeLetters(prev, getFrameLayout(device, frame), nextId));
    }, [frame, device, nextId]);

    const rows = device === 'tablet' ? 6 : device === 'mobile' ? 9 : 5;
    const cols = device === 'tablet' ? 5 : device === 'mobile' ? 5 : 7;

    // Свайп по нижнему ряду работает как перемотка: кадр меняется на каждом отрезке пути
    // пальца, так что один жест через весь блок пролистывает все фото по очереди.
    const swipeRef = useRef<{ x: number; y: number; steps: number; horizontal: boolean | null } | null>(null);

    // Пока идёт перемотка, кадры сменяются быстро (класс на блоке укорачивает и смену фото)
    const [scrubbing, setScrubbing] = useState(false);
    const scrubbingRef = useRef(false);
    const scrubTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
    useEffect(() => () => clearTimeout(scrubTimerRef.current), []);

    const stepFrames = (steps: number) => {
        if (steps === 0) return;
        scrubbingRef.current = true;
        setScrubbing(true);
        clearTimeout(scrubTimerRef.current);
        scrubTimerRef.current = setTimeout(() => {
            scrubbingRef.current = false;
            setScrubbing(false);
        }, SCRUB_IDLE_MS);
        setFrame(prev => (((prev + steps) % FRAMES.length) + FRAMES.length) % FRAMES.length);
    };

    const swipeStepPx = (zone: HTMLElement) => Math.max(SWIPE_MIN_STEP_PX, zone.clientWidth / FRAMES.length);

    const onSwipeStart = (event: ReactPointerEvent<HTMLDivElement>) => {
        swipeRef.current = { x: event.clientX, y: event.clientY, steps: 0, horizontal: null };
    };

    const onSwipeMove = (event: ReactPointerEvent<HTMLDivElement>) => {
        const swipe = swipeRef.current;
        if (!swipe) return;

        const dx = event.clientX - swipe.x;
        const dy = event.clientY - swipe.y;
        if (swipe.horizontal === null) {
            if (Math.max(Math.abs(dx), Math.abs(dy)) < 10) return;
            swipe.horizontal = Math.abs(dx) > Math.abs(dy);
            if (swipe.horizontal) event.currentTarget.setPointerCapture?.(event.pointerId);
        }
        if (!swipe.horizontal) return;

        // влево — вперёд, вправо — назад
        const steps = Math.trunc(-dx / swipeStepPx(event.currentTarget));
        stepFrames(steps - swipe.steps);
        swipe.steps = steps;
    };

    const onSwipeEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
        const swipe = swipeRef.current;
        swipeRef.current = null;
        if (!swipe || swipe.horizontal === false || swipe.steps !== 0) return;

        // короткий рывок меньше одного отрезка тоже листает на один кадр
        const dx = event.clientX - swipe.x;
        if (Math.abs(dx) >= SWIPE_THRESHOLD_PX && Math.abs(dx) > Math.abs(event.clientY - swipe.y)) {
            stepFrames(dx < 0 ? 1 : -1);
        }
    };

    // Трекпад: горизонтальный жест двумя пальцами над нижним рядом листает так же,
    // кадр на каждый отрезок прокрутки
    const wheelSumRef = useRef(0);

    const onSwipeWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
        if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
        const stepPx = swipeStepPx(event.currentTarget);
        wheelSumRef.current += event.deltaX;
        const steps = Math.trunc(wheelSumRef.current / stepPx);
        if (steps === 0) return;
        wheelSumRef.current -= steps * stepPx;
        stepFrames(steps);
    };

    // Движение букв запускаем до отрисовки кадра: буква стоит в новой клетке,
    // а анимация ведёт её туда из прежней
    useLayoutEffect(() => {
        const positions = letterPositionsRef.current;
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (!reduceMotion && positions.size > 0) {
            animateLetters(letters, positions, letterElementsRef.current, scrubbingRef.current);
        }

        positions.clear();
        letters.forEach(letter => {
            if (!letter.leaving) positions.set(letter.id, { x: letter.cell.x, y: letter.cell.y });
        });
    }, [letters]);

    const renderGrid = useCallback(() => {
        const grid = [];
        const config = getFrameLayout(device, frame);

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
        <div className={`society-photos-block-wrapper ${scrubbing ? 'society-scrubbing' : ''}`} id='society-photos-block' ref={wrapperRef}>
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
                            '--society-photo-x': MOBILE_PHOTO_X[i + 1],
                        } as CSSProperties}
                    />
                ))}
            </div>

            <div className='society-photos-block-grid-wrapper'>
                {renderGrid()}

                <div
                    className='society-swipe-zone'
                    style={{ height: `${100 / rows}%` }}
                    onPointerDown={onSwipeStart}
                    onPointerMove={onSwipeMove}
                    onPointerUp={onSwipeEnd}
                    onPointerCancel={() => { swipeRef.current = null; }}
                    onWheel={onSwipeWheel}
                    aria-hidden='true'
                />

                <div className='society-letters'>
                    {letters.map(letter => {
                        const span = letter.cell.colSpan ?? 1;

                        return (
                            <div
                                key={letter.id}
                                data-span={span}
                                data-kind={letter.cell.type}
                                className={`society-letter ${letter.leaving ? 'leaving' : ''}`}
                                style={{
                                    width: `${100 * span / cols}%`,
                                    height: `${100 / rows}%`,
                                    transform: `translate(${letter.cell.x * 100 / span}%, ${letter.cell.y * 100}%)`,
                                }}
                            >
                                <div
                                    className='society-letter-inner'
                                    ref={element => {
                                        if (element) letterElementsRef.current.set(letter.id, element);
                                        else letterElementsRef.current.delete(letter.id);
                                    }}
                                >
                                    <div className='cell-content'>
                                        {renderLetterContent(letter.cell)}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

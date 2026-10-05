/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useRef, useState, type CSSProperties } from 'react';

import './more-new.css';
import { FONT_MONT_BOOK } from '@/app/fonts';
import Image from 'next/image';
import Cross from '../../../../public/v2/more-new-cross.svg';
import Live from '../../../../public/v2/more-new-live.svg';
import Telegram from '../../../../public/v2/more-new-telegram.svg';
import Youtube from '../../../../public/v2/more-new-youtube.svg';
import { useGetLinkWithUtm } from '@/app/hooks/use-get-link-with-utm';
import { SOUTHHUB_YOUTUBE, TELEGRAM_CHANELL_LINK, YOUTUBE_PLAYLIST_LINK } from '@/app/constants';

const columnGrid = {
    desktop: 13,
    desktop_s: 11,
    tablet: 7,
    mobile: 5,
};

// Десктоп: шаг сетки как в макете 1440 (крестик 50px + промежуток ~56px). На экранах
// шире 1440 добавляются столбцы, на более узких столбцов 13 и сетка сжимается в процентах.
// Выше 1920 страница масштабируется целиком (wide-screen.css), столбцов столько же, сколько на 1920.
const DESKTOP_MIN_COLUMNS = 13;
const DESKTOP_PITCH = 106;
const DESKTOP_SIDE_PADDING = 60;

const getDesktopColumns = () => {
    const content = Math.min(window.innerWidth, 1920) - DESKTOP_SIDE_PADDING * 2;
    return Math.max(DESKTOP_MIN_COLUMNS, Math.floor((content + DESKTOP_PITCH - 50) / DESKTOP_PITCH));
};

// Волна, как в блоке с буквами U: крестики отталкиваются от курсора (на телефоне — от пальца)
// и поворачиваются тем сильнее, чем ближе курсор. Быстро реагируют, медленно возвращаются.
// Ближайший крестик превращается в иконку, на телефоне повторное касание открывает ссылку.
const WAVE_RADIUS = 1.1;        // радиус влияния в шагах сетки по горизонтали
const WAVE_SHIFT = 14;          // максимальный сдвиг от курсора, px
const WAVE_TURN = 0.75;         // поворот: доля угла направления от курсора
const WAVE_GROW = 0.22;
const WAVE_FADE = 0.06;

export const MoreNew = () => {
    const [device, setDevice] = useState<'desktop' | 'desktop_s' | 'tablet' | 'mobile'>('desktop');
    const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);
    const [desktopColumns, setDesktopColumns] = useState(DESKTOP_MIN_COLUMNS);
    const blockRef = useRef<HTMLDivElement>(null);
    const hoveredCellRef = useRef(hoveredCell);
    hoveredCellRef.current = hoveredCell;
    // касание открывает ссылку, только если иконка в этой клетке уже была показана
    const touchOpensLinkRef = useRef<boolean | null>(null);

    const getLinkWIthUtm = useGetLinkWithUtm();

    useEffect(() => {
        const header = document.querySelector('#header');
        const targetBlock = document.querySelector('#more-new');
        
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

    // Responsive device detection
    useEffect(() => {
        const updateColumn = () => {
            const desktop_s = window.matchMedia('(max-width: 1280px)').matches;
            const tablet = window.matchMedia('(max-width: 1024px)').matches;
            const mobile = window.matchMedia('(max-width: 767px)').matches;

            if (mobile) { setDevice('mobile'); return; }
            if (tablet) { setDevice('tablet'); return; }
            if (desktop_s) { setDevice('desktop_s'); return; }
            setDevice('desktop');
            setDesktopColumns(getDesktopColumns());
        };

        window.addEventListener('resize', updateColumn);
        updateColumn();

        return () => {
            window.removeEventListener('resize', updateColumn);
        };
    }, []);

    useEffect(() => {
        const block = blockRef.current;
        if (!block) return;
        const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

        const cells = Array.from(block.querySelectorAll<HTMLElement>('[data-wave-cell]'));
        const crosses = cells.map((cell) => cell.querySelector<HTMLElement>('[data-wave-cross]'));

        // Зона наведения каждой клетки растягивается до середины пути к соседним
        // (псевдоэлемент в CSS), поэтому между крестиками нет «мёртвых» промежутков.
        const updateHitArea = () => {
            if (cells.length < 2) return;
            const a = cells[0].getBoundingClientRect();
            const b = cells[1].getBoundingClientRect();
            const row = block.querySelectorAll('.more-new-row');
            const rowGap = row.length > 1
                ? row[1].getBoundingClientRect().top - row[0].getBoundingClientRect().bottom
                : 0;
            block.style.setProperty('--wave-gap-x', `${Math.max(0, (b.left - a.right) / 2)}px`);
            block.style.setProperty('--wave-gap-y', `${Math.max(0, rowGap / 2)}px`);
        };
        updateHitArea();
        window.addEventListener('resize', updateHitArea);

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return () => window.removeEventListener('resize', updateHitArea);
        }

        const current = cells.map(() => 0);
        const target = cells.map(() => 0);
        const dir = cells.map(() => ({ x: 0, y: 0, angle: 0 }));
        let frame = 0;

        const tick = () => {
            let moving = false;
            crosses.forEach((cross, i) => {
                const diff = target[i] - current[i];
                if (Math.abs(diff) < 0.002) {
                    current[i] = target[i];
                } else {
                    current[i] += diff * (diff > 0 ? WAVE_GROW : WAVE_FADE);
                    moving = true;
                }
                if (!cross) return;
                const k = current[i];
                const { x, y, angle } = dir[i];
                cross.style.transform = k === 0
                    ? ''
                    : `translate(${(x * WAVE_SHIFT * k).toFixed(2)}px, ${(y * WAVE_SHIFT * k).toFixed(2)}px) rotate(${(angle * WAVE_TURN * k).toFixed(1)}deg)`;
            });
            frame = moving ? requestAnimationFrame(tick) : 0;
        };
        const run = () => {
            if (!frame) frame = requestAnimationFrame(tick);
        };

        const wave = (point: { clientX: number; clientY: number }) => {
            const centers = cells.map((cell) => {
                const r = cell.getBoundingClientRect();
                return [r.left + r.width / 2, r.top + r.height / 2];
            });
            const pitch = centers.length > 1 ? Math.abs(centers[1][0] - centers[0][0]) || 150 : 150;
            const radius = pitch * WAVE_RADIUS;

            let nearest = -1;
            let nearestDist = Infinity;
            centers.forEach(([cx, cy], i) => {
                const dx = cx - point.clientX;
                const dy = cy - point.clientY;
                const len = Math.hypot(dx, dy);
                if (len < nearestDist) { nearestDist = len; nearest = i; }
                const d = len / radius;
                target[i] = Math.exp(-d * d);
                if (len > 0.5) {
                    // угол направления от курсора: 0° — сверху, 90° — справа, ±180° — снизу
                    dir[i] = { x: dx / len, y: dy / len, angle: (Math.atan2(dx, -dy) * 180) / Math.PI };
                }
            });
            // крестик под курсором превращается в иконку, его не двигаем
            if (nearest >= 0) target[nearest] = 0;
            run();
            return nearest;
        };
        const onLeave = () => {
            target.fill(0);
            run();
        };

        const onMove = (event: PointerEvent) => {
            if (event.pointerType === 'touch') return;
            wave(event);
        };

        // Телефон: волна идёт за пальцем, в том числе пока страница прокручивается,
        // а иконкой становится крестик под пальцем. После касания иконка остаётся на месте.
        const onTouch = (event: TouchEvent) => {
            const touch = event.touches[0];
            if (!touch) return;
            const nearest = wave(touch);
            const cell = cells[nearest];
            if (cell?.dataset.row && cell.dataset.col) {
                const row = Number(cell.dataset.row);
                const col = Number(cell.dataset.col);
                if (event.type === 'touchstart') {
                    const shown = hoveredCellRef.current;
                    touchOpensLinkRef.current = shown?.row === row && shown.col === col;
                }
                setHoveredCell((prev) => (prev?.row === row && prev.col === col ? prev : { row, col }));
            }
        };

        if (finePointer) {
            block.addEventListener('pointermove', onMove);
            block.addEventListener('pointerleave', onLeave);
        }
        block.addEventListener('touchstart', onTouch, { passive: true });
        block.addEventListener('touchmove', onTouch, { passive: true });
        block.addEventListener('touchend', onLeave);
        block.addEventListener('touchcancel', onLeave);
        return () => {
            window.removeEventListener('resize', updateHitArea);
            block.removeEventListener('pointermove', onMove);
            block.removeEventListener('pointerleave', onLeave);
            block.removeEventListener('touchstart', onTouch);
            block.removeEventListener('touchmove', onTouch);
            block.removeEventListener('touchend', onLeave);
            block.removeEventListener('touchcancel', onLeave);
            cancelAnimationFrame(frame);
            crosses.forEach((cross) => { if (cross) cross.style.transform = ''; });
        };
    }, [device, desktopColumns]);

    const isHovered = (row: number, col: number): boolean => {
        if (!hoveredCell) return false;
        return hoveredCell.row === row && hoveredCell.col === col;
    };

    const renderCellContent = (row: number, col: number) => {
        if (
            (device === 'mobile' && row === 3 && col === 0) ||
            (row === 3 && col === 1)
        ) {
            return (
                <div className={`more-new-special-cell more-new-special-cell-third-row ${FONT_MONT_BOOK.className}`}>
                    у нас много нового
                </div>
            );
        }

        const isCurrentlyHovered = isHovered(row, col);

        const linkTo = () => {
            const touchOpensLink = touchOpensLinkRef.current;
            touchOpensLinkRef.current = null;
            if (touchOpensLink === false) return;

            if ([0, 1].includes(row)) {
                return window.open(getLinkWIthUtm(TELEGRAM_CHANELL_LINK), '_blank');
            }
            if ([2, 3, 4].includes(row)) {
                return window.open(getLinkWIthUtm(YOUTUBE_PLAYLIST_LINK), '_blank');
            }
            if ([5, 6].includes(row)) {
                return window.open(getLinkWIthUtm(SOUTHHUB_YOUTUBE), '_blank');
            }
        };

        return (
            <div className="more-new-svg-container" onClick={linkTo}>
                <Image
                    src={Cross}
                    alt=""
                    width={device === 'mobile' ? 30 : 50}
                    height={device === 'mobile' ? 30 : 50}
                    className="more-new-svg-icon more-new-svg-icon-cross"
                    data-wave-cross
                    style={{ opacity: isCurrentlyHovered ? 0 : 1 }}
                    unoptimized
                />
                <Image
                    src={Telegram}
                    alt=""
                    width={50}
                    height={50}
                    className="more-new-svg-icon"
                    style={{ opacity: [0, 1].includes(row) && isCurrentlyHovered ? 1 : 0, cursor: 'pointer' }}
                    unoptimized
                />
                <Image
                    src={Live}
                    alt=""
                    width={50}
                    height={50}
                    className="more-new-svg-icon"
                    style={{ opacity: [2, 3, 4].includes(row) && isCurrentlyHovered ? 1 : 0, cursor: 'pointer' }}
                    unoptimized
                />
                <Image
                    src={Youtube}
                    alt=""
                    width={50}
                    height={50}
                    className="more-new-svg-icon"
                    style={{ opacity: [5, 6].includes(row) && isCurrentlyHovered ? 1 : 0, cursor: 'pointer' }}
                    unoptimized
                />
            </div>
        );
    };

    const columns = device === 'desktop' ? desktopColumns : columnGrid[device];

    const getRowCells = (row: number) => {
        if (row === 3) {
            if (device === 'desktop_s') {
                return [
                    { type: 'svg', col: 0, span: 1 },
                    { type: 'special', col: 1, span: 7 },
                    ...Array.from({ length: columns - 8 }, (_, i) => ({ type: 'svg', col: i + 8, span: 1 })),
                ];
            }

            if (device === 'tablet') {
                return [
                    { type: 'svg', col: 0, span: 1 },
                    { type: 'special', col: 1, span: 5 },
                    ...Array.from({ length: columns - 5 }, (_, i) => ({ type: 'svg', col: i + 5, span: 1 })),
                ];
            }

            if (device === 'mobile') {
                return [{ type: 'special', col: 0, span: 5 }];
            }

            return [
                { type: 'svg', col: 0, span: 1 },
                { type: 'special', col: 1, span: 7 },
                ...Array.from({ length: columns - 8 }, (_, i) => ({ type: 'svg', col: i + 8, span: 1 })),
            ];
        } else {
            return Array.from({ length: columns }, (_, i) => ({ type: 'svg', col: i, span: 1 }));
        }
    };

    // касание на телефоне ставит иконку само (волна выше), мышиные события браузер
    // при касании тоже присылает, их пропускаем, чтобы иконка не пропадала
    const handleMouseEnter = (row: number, col: number, type: string) => {
        if (type === 'svg' && window.matchMedia('(hover: hover)').matches) {
            setHoveredCell({ row, col });
        }
    };

    const handleMouseLeave = () => {
        if (window.matchMedia('(hover: hover)').matches) {
            setHoveredCell(null);
        }
    };

    return (
        <div
            className="more-new"
            id="more-new"
            ref={blockRef}
            style={device === 'desktop' ? ({ '--more-new-columns': columns } as CSSProperties) : undefined}
        >
            {[0, 1, 2, 3, 4, 5, 6].map((row) => {
                const rowCells = getRowCells(row);

                return (
                    <div key={row} className={`more-new-row more-new-row-${row}`}>
                        {rowCells.map((cell, index) => (
                            <div
                                key={`${row}-${cell.col}-${index}`}
                                className={`more-new-cell ${
                                    cell.type === 'special' ? 'more-new-special-cell-wrapper' : ''
                                }`}
                                data-wave-cell={cell.type === 'svg' ? '' : undefined}
                                data-row={row}
                                data-col={cell.col}
                                onMouseEnter={() => handleMouseEnter(row, cell.col, cell.type)}
                                onMouseLeave={handleMouseLeave}
                            >
                                {renderCellContent(row, cell.col)}
                            </div>
                        ))}
                    </div>
                );
            })}
        </div>
    );
};

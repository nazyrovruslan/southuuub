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

const FIXED_CELLS: Record<'tablet' | 'mobile', { row: number; col: number }[]> = {
    tablet: [{ row: 1, col: 1 }, { row: 2, col: 5 }, { row: 5, col: 3 }],
    mobile: [{ row: 1, col: 1 }, { row: 2, col: 3 }, { row: 5, col: 2 }],
};

// Волна на десктопе, как в блоке с буквами U: крестики отталкиваются от курсора и
// поворачиваются тем сильнее, чем ближе курсор. Быстро реагируют, медленно возвращаются.
const WAVE_RADIUS = 1.1;        // радиус влияния в шагах сетки по горизонтали
const WAVE_SHIFT = 14;          // максимальный сдвиг от курсора, px
const WAVE_TURN = 0.75;         // поворот: доля угла направления от курсора
const WAVE_GROW = 0.22;
const WAVE_FADE = 0.06;

export const MoreNew = () => {
    const [device, setDevice] = useState<'desktop' | 'desktop_s' | 'tablet' | 'mobile'>('desktop');
    const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);
    const [fixedCells, setFixedCells] = useState<{ row: number; col: number }[]>([]);
    const [isMobileVisible, setMobileVisible] = useState(false);
    const [desktopColumns, setDesktopColumns] = useState(DESKTOP_MIN_COLUMNS);
    const blockRef = useRef<HTMLDivElement>(null);

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
        if (device !== 'tablet' && device !== 'mobile') {
            setFixedCells([]);
            setMobileVisible(false);
            return;
        }

        const targetBlock = document.querySelector('#more-new') as HTMLElement;
        if (!targetBlock) return;

        let lastScrollY = window.scrollY;

        const changeOpen = (open: boolean) => {
            setFixedCells(open ? FIXED_CELLS[device] : []);
            setMobileVisible(open);
        }

        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            const isScrollingDown = currentScrollY > lastScrollY;
            const rect = targetBlock.getBoundingClientRect();
            const blockHeight = targetBlock.offsetHeight;

            if (isScrollingDown && rect.bottom <= 250) {
                changeOpen(false);
            } else if (isScrollingDown && rect.top <= 70) {
                changeOpen(true);
            } else if (!isScrollingDown && rect.top <= 0 && rect.top > -(blockHeight / 2)) {
                changeOpen(true);
            } else if (rect.bottom <= -70) {
                changeOpen(false);
            } else {
                changeOpen(false);
            }

            lastScrollY = currentScrollY;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => window.removeEventListener('scroll', handleScroll);
    }, [device]);

    useEffect(() => {
        const block = blockRef.current;
        if (!block || (device !== 'desktop' && device !== 'desktop_s')) return;
        if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

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

        const onMove = (event: PointerEvent) => {
            const centers = cells.map((cell) => {
                const r = cell.getBoundingClientRect();
                return [r.left + r.width / 2, r.top + r.height / 2];
            });
            const pitch = centers.length > 1 ? Math.abs(centers[1][0] - centers[0][0]) || 150 : 150;
            const radius = pitch * WAVE_RADIUS;

            let nearest = -1;
            let nearestDist = Infinity;
            centers.forEach(([cx, cy], i) => {
                const dx = cx - event.clientX;
                const dy = cy - event.clientY;
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
        };
        const onLeave = () => {
            target.fill(0);
            run();
        };

        block.addEventListener('pointermove', onMove);
        block.addEventListener('pointerleave', onLeave);
        return () => {
            window.removeEventListener('resize', updateHitArea);
            block.removeEventListener('pointermove', onMove);
            block.removeEventListener('pointerleave', onLeave);
            cancelAnimationFrame(frame);
            crosses.forEach((cross) => { if (cross) cross.style.transform = ''; });
        };
    }, [device, desktopColumns]);

    // Returns active hover sources depending on device
    const getActiveSources = (): { row: number; col: number }[] => {
        if (device === 'tablet' || device === 'mobile') return fixedCells;
        return hoveredCell ? [hoveredCell] : [];
    };

    const isSpecialCell = (row: number, col: number): boolean => {
        if (device === 'mobile') {
            return row === 3 && col === 0;
        }
        return row === 3 && col === 1;
    };

    const shouldRotate = (row: number, col: number): boolean => {
        // на десктопе крестики двигает волна (см. эффект выше)
        if (device === 'desktop' || device === 'desktop_s') return false;
        const sources = getActiveSources();
        if (sources.length === 0) return false;

        return sources.some((source) => {
            if (isSpecialCell(source.row, source.col)) return false;

            const isNeighbor =
                Math.abs(row - source.row) <= 1 &&
                Math.abs(col - source.col) <= 1 &&
                !(row === source.row && col === source.col);

            if (isNeighbor && isSpecialCell(row, col)) return false;
            return isNeighbor;
        });
    };

    const getRotateIcon = (
        row: number,
        col: number
    ): 'top' | 'top-right' | 'right' | 'bottom-right' | 'bottom' | 'bottom-left' | 'left' | 'top-left' | 'none' => {
        if (!shouldRotate(row, col)) return 'none';

        const sources = getActiveSources();

        const source = sources.find((s) => {
            if (isSpecialCell(s.row, s.col)) return false;
            const isNeighbor =
                Math.abs(row - s.row) <= 1 &&
                Math.abs(col - s.col) <= 1 &&
                !(row === s.row && col === s.col);
            if (isNeighbor && isSpecialCell(row, col)) return false;
            return isNeighbor;
        });

        if (!source) return 'none';

        const rowDiff = row - source.row;
        const colDiff = col - source.col;

        if (rowDiff === -1 && colDiff === 0)  return 'top';
        if (rowDiff === -1 && colDiff === 1)  return 'top-right';
        if (rowDiff === 0  && colDiff === 1)  return 'right';
        if (rowDiff === 1  && colDiff === 1)  return 'bottom-right';
        if (rowDiff === 1  && colDiff === 0)  return 'bottom';
        if (rowDiff === 1  && colDiff === -1) return 'bottom-left';
        if (rowDiff === 0  && colDiff === -1) return 'left';
        if (rowDiff === -1 && colDiff === -1) return 'top-left';

        return 'none';
    };

    const isHovered = (row: number, col: number): boolean => {
        if (device === 'tablet' || device === 'mobile') {
            return fixedCells.some((c) => c.row === row && c.col === col);
        }
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

        const rotateIcon = getRotateIcon(row, col);
        const isCurrentlyHovered = isHovered(row, col);

        const style = { transform: '' };

        if (device === 'mobile' && isMobileVisible) {
            if (row === 0 && col === 0) {
                style.transform = `translate(0px, -10px) rotate(15deg)`;
            } else if (row === 0 && col === 1) {
                style.transform = `translate(0px, -10px) rotate(0)`;
            } else if (row === 0 && col === 2) {
                style.transform = `translate(0px, -10px) rotate(-15deg)`;
            }

            else if (row === 1 && col === 0) {
                style.transform = `translate(0, 5px) rotate(0)`;
            } else if (row === 1 && col === 2) {
                style.transform = `translate(0px, 5px) rotate(15deg)`;
            } else if (row === 1 && col === 3) {
                style.transform = `translate(0px, -10px) rotate(0)`;
            } else if (row === 1 && col === 4) {
                style.transform = `translate(0px, -10px) rotate(-15deg)`;
            }

            else if (row === 2 && col === 0) {
                style.transform = `translate(0, 10px) rotate(-15deg)`;
            } else if (row === 2 && col === 1) {
                style.transform = `translate(0px, 10px) rotate(0)`;
            } else if (row === 2 && col === 2) {
                style.transform = `translate(0px, 10px) rotate(-15deg)`;
            } else if (row === 2 && col === 4) {
                style.transform = `translate(0px, 10px) rotate(15deg)`;
            }

            else if (row === 4 && col === 1) {
                style.transform = `translate(0, -10px) rotate(15deg)`;
            } else if (row === 4 && col === 2) {
                style.transform = `translate(0px, -10px) rotate(0)`;
            } else if (row === 4 && col === 3) {
                style.transform = `translate(0px, -10px) rotate(-15deg)`;
            }

            else if (row === 5 && col === 1) {
                style.transform = `translate(-5px, 0) rotate(-15deg)`;
            } else if (row === 5 && col === 3) {
                style.transform = `translate(5px, 0) rotate(15deg)`;
            }

            else if (row === 6 && col === 1) {
                style.transform = `translate(0, 10px) rotate(-15deg)`;
            } else if (row === 6 && col === 2) {
                style.transform = `translate(0px, 10px) rotate(0)`;
            } else if (row === 6 && col === 3) {
                style.transform = `translate(0px, 10px) rotate(15deg)`;
            }
        } else if (device === 'tablet' ? isMobileVisible : true) {
            switch (rotateIcon) {
                case 'top':
                    style.transform = `translate(0px, -10px) rotate(35deg)`;
                    break;
                case 'bottom':
                    style.transform = `translate(0px, 10px) rotate(-35deg)`;
                    break;
                case 'top-right':
                    style.transform = `translate(10px, -10px) rotate(45deg)`;
                    break;
                case 'bottom-left':
                    style.transform = `translate(-10px, 10px) rotate(-135deg)`;
                    break;
                case 'top-left':
                    style.transform = `translate(-10px, -10px) rotate(-45deg)`;
                    break;
                case 'bottom-right':
                    style.transform = `translate(10px, 10px) rotate(135deg)`;
                    break;
                case 'right':
                    style.transform = `translate(10px, 0px) rotate(90deg)`;
                    break;
                case 'left':
                    style.transform = `translate(-10px, 0px) rotate(-90deg)`;
                    break;
                default:
                    break;
            }
        }

        const linkTo = () => {
            if (device === 'tablet') {
                if (row === 1 && col === 1) {
                    return window.open(getLinkWIthUtm(TELEGRAM_CHANELL_LINK), '_blank');
                }
                if (row === 2 && col === 5) {
                    return window.open(getLinkWIthUtm(YOUTUBE_PLAYLIST_LINK), '_blank');
                }
                if (row === 5 && col === 3) {
                    return window.open(getLinkWIthUtm(SOUTHHUB_YOUTUBE), '_blank');
                }
                return;
            }

            if (device === 'mobile') {
                if (row === 1 && col === 1) {
                    return window.open(getLinkWIthUtm(TELEGRAM_CHANELL_LINK), '_blank');
                }
                if (row === 2 && col === 3) {
                    return window.open(getLinkWIthUtm(YOUTUBE_PLAYLIST_LINK), '_blank');
                }
                if (row === 5 && col === 2) {
                    return window.open(getLinkWIthUtm(SOUTHHUB_YOUTUBE), '_blank');
                }
                return;
            }

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
                    style={{ ...style, opacity: isCurrentlyHovered ? 0 : 1 }}
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

    const handleMouseEnter = (row: number, col: number, type: string) => {
        if (device === 'desktop' || device === 'desktop_s') {
            if (type === 'svg') {
                setHoveredCell({ row, col });
            }
        }
    };

    const handleMouseLeave = () => {
        if (device === 'desktop' || device === 'desktop_s') {
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

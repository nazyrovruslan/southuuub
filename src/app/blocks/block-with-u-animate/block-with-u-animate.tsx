import { useEffect, useRef, useState, type CSSProperties } from 'react';

import './block-with-u-animate.css';
import { FONT_MONT_BOOK } from '@/app/fonts';
import Image from 'next/image';
import U from '../../../../public/v2/animate-u.svg';
import B from '../../../../public/v2/animate-b.svg';
import Logo from '../../../../public/v2/animate-u-block-logo.svg';

const rowGrid = {
    desktop: [0, 1, 2, 3, 4],
    desktop_s: [0, 1, 2, 3, 4],
    tablet: [0, 1, 2, 3, 4, 5, 6],
    mobile: [0, 1, 2, 3, 4, 5, 6],
}

const columnGrid = {
    desktop: 12,
    desktop_s: 10,
    tablet: 10,
    mobile: 6,
}

// Десктоп: шаг сетки как в макете 1440 (буква 50px + промежуток ~66px). На экранах шире
// 1440 добавляются столбцы с буквами, SOUTHU остаётся с левого края, B — справа в нижнем ряду.
// Выше 1920 страница масштабируется целиком (wide-screen.css), столбцов столько же, сколько на 1920.
const DESKTOP_MIN_COLUMNS = 12;
const DESKTOP_PITCH = 115.5;
const DESKTOP_SIDE_PADDING = 60;

const getDesktopColumns = () => {
    const content = Math.min(window.innerWidth, 1920) - DESKTOP_SIDE_PADDING * 2;
    return Math.max(DESKTOP_MIN_COLUMNS, Math.floor((content + DESKTOP_PITCH - 50) / DESKTOP_PITCH));
};

const getAllTabletCells = () => {
    const cells = [];
    for (let row = 0; row <= 6; row++) {
        for (let col = 0; col <= 9; col++) {
            if (row === 0 && col === 0) continue;
            if (row === 3 && col === 3) continue;
            cells.push({ row, col });
        }
    }
    return cells;
};

const getAllMobileCells = () => {
    const cells = [];
    for (let row = 0; row <= 6; row++) {
        for (let col = 0; col <= 5; col++) {
            if (row === 0 && col === 0) continue;
            if (row === 3 && col === 1) continue;
            cells.push({ row, col });
        }
    }
    return cells;
};

// Волна на десктопе: каждая буква увеличивается по расстоянию от неё до курсора,
// поэтому вместе с наведённой растут соседи по бокам, сверху и снизу, а зона
// наведения непрерывная — каждая буква «ловит» курсор до середины пути к соседней.
const WAVE_MAX_SCALE = 2;       // наведённая буква: 20px -> 40px, как раньше
const WAVE_LOGO_MAX_SCALE = 1.35; // логотип SOUTHU шире буквы: растёт меньше, чтобы не наезжать на U
const WAVE_RADIUS = 1.1;        // радиус влияния в шагах сетки по горизонтали
const WAVE_GROW = 0.22;         // скорость увеличения за кадр (быстро)
const WAVE_FADE = 0.06;         // скорость затухания за кадр (медленно)

/**
 * TODO после выкатки
 * 1) Они должны при просто наведении увеличиваться медленно и медленно затухать
 * 2) Если юыстро проводить курсором, то они быстро увеличиваются и так же медленно затухают
 * 3) Пространство между ними???
 * 4) Динамическое количество
 * 5) Верхнюю строчку сделать как на макете не по сетке
 */

export const BlockWithUAnimate = () => {
    const [device, setDevice] = useState<'desktop' | 'desktop_s' | 'tablet' | 'mobile'>('desktop');
    const [animatedCell, setAnimatedCell] = useState<{ row: number; col: number } | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const [desktopColumns, setDesktopColumns] = useState(DESKTOP_MIN_COLUMNS);
    const blockRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const header = document.querySelector('#header');
        const targetBlock = document.querySelector('#block-with-u-animate');

        if (!header || !targetBlock) return;

        let lastScrollY = window.scrollY;

        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            const blockRect = targetBlock.getBoundingClientRect();
            const blockTop = blockRect.top - 70;
            const isScrollingUp = currentScrollY < lastScrollY;
            
            // Проверяем, виден ли блок в области просмотра
            const isVisible = blockRect.bottom > 0 && blockRect.top < window.innerHeight;

            if (!isVisible) {
                // Блок покинул область видимости → показываем хедер
                header.classList.remove('header_hidden');
            } else {
                // Блок виден → применяем исходную логику
                if (blockTop <= 0) {
                    header.classList.add('header_hidden');
                } 
                else if (isScrollingUp && blockTop <= 70) {
                    header.classList.add('header_hidden');
                } else {
                    header.classList.remove('header_hidden');
                }
            }
            
            lastScrollY = currentScrollY;
        };

        window.addEventListener('scroll', handleScroll);
        handleScroll(); // начальная проверка

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    useEffect(() => {
        const updateColumn = () => {
            const desktop_s = window.matchMedia("(max-width: 1280px)").matches;
            const tablet = window.matchMedia("(max-width: 1024px)").matches;
            const mobile = window.matchMedia("(max-width: 767px)").matches;

            if (mobile) {
                setDevice('mobile');
                return;
            }

            if (tablet) {
                setDevice('tablet');
                return;
            }

            if (desktop_s) {
                setDevice('desktop_s');
                return;
            }

            setDevice('desktop');
            setDesktopColumns(getDesktopColumns());
        }

        window.addEventListener('resize', updateColumn);
        updateColumn();

        return () => {
            window.removeEventListener('resize', updateColumn);
        }
    }, []);

    useEffect(() => {
        if (device === 'desktop' || device === 'desktop_s') {
            return;
        }

        const getRandomCell = () => {
            const cells = device === 'tablet' ? getAllTabletCells() : getAllMobileCells();
            const randomIndex = Math.floor(Math.random() * cells.length);
            return cells[randomIndex];
        };

        const animateRandomCell = () => {
            const randomCell = getRandomCell();
            setAnimatedCell(randomCell);
            setIsAnimating(true);
            
            setTimeout(() => {
                setIsAnimating(false);
            }, 500);
            
            setTimeout(() => {
                setAnimatedCell(null);
            }, 1000);
        };

        animateRandomCell();
        
        const interval = setInterval(() => {
            animateRandomCell();
        }, 1500);
        
        return () => {
            clearInterval(interval);
        };
    }, [device]);

    useEffect(() => {
        const block = blockRef.current;
        if (!block || (device !== 'desktop' && device !== 'desktop_s')) return;
        if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        const icons = Array.from(block.querySelectorAll<HTMLElement>('[data-wave-letter]'));
        const current = icons.map(() => 1);
        const target = icons.map(() => 1);
        let frame = 0;

        const tick = () => {
            let moving = false;
            icons.forEach((icon, i) => {
                const diff = target[i] - current[i];
                if (Math.abs(diff) < 0.002) {
                    current[i] = target[i];
                } else {
                    current[i] += diff * (diff > 0 ? WAVE_GROW : WAVE_FADE);
                    moving = true;
                }
                icon.style.transform = current[i] === 1 ? '' : `scale(${current[i].toFixed(3)})`;
            });
            frame = moving ? requestAnimationFrame(tick) : 0;
        };
        const run = () => {
            if (!frame) frame = requestAnimationFrame(tick);
        };

        const onMove = (event: PointerEvent) => {
            const rects = icons.map((icon) => icon.getBoundingClientRect());
            // шаг сетки по горизонтали: расстояние между двумя соседними буквами одной строки
            // (по центрам: масштаб меняет края прямоугольника, но не центр)
            const centers = rects.map((r) => [r.left + r.width / 2, r.top + r.height / 2]);
            let pitch = Infinity;
            for (let i = 1; i < centers.length; i++) {
                const dx = Math.abs(centers[i][0] - centers[i - 1][0]);
                if (dx > 1 && Math.abs(centers[i][1] - centers[i - 1][1]) < 1) pitch = Math.min(pitch, dx);
            }
            const radius = (Number.isFinite(pitch) ? pitch : 150) * WAVE_RADIUS;

            centers.forEach(([cx, cy], i) => {
                const icon = icons[i];
                if (icon.dataset.waveLogo !== undefined) {
                    // логотип растёт от левого края: расстояние считаем до его прямоугольника без масштаба
                    const left = rects[i].left;
                    const right = left + icon.offsetWidth;
                    const half = icon.offsetHeight / 2;
                    const dx = Math.max(left - event.clientX, 0, event.clientX - right);
                    const dy = Math.max(Math.abs(event.clientY - cy) - half, 0);
                    const d = Math.hypot(dx, dy) / radius;
                    target[i] = 1 + (WAVE_LOGO_MAX_SCALE - 1) * Math.exp(-d * d);
                    return;
                }
                const d = Math.hypot(event.clientX - cx, event.clientY - cy) / radius;
                target[i] = 1 + (WAVE_MAX_SCALE - 1) * Math.exp(-d * d);
            });
            run();
        };
        const onLeave = () => {
            target.fill(1);
            run();
        };

        block.addEventListener('pointermove', onMove);
        block.addEventListener('pointerleave', onLeave);
        return () => {
            block.removeEventListener('pointermove', onMove);
            block.removeEventListener('pointerleave', onLeave);
            cancelAnimationFrame(frame);
            icons.forEach((icon) => { icon.style.transform = ''; });
        };
    }, [device, desktopColumns]);

    const columns = device === 'desktop' ? desktopColumns : columnGrid[device];

    const shouldScale = (row: number, col: number): boolean => {
        if (device === 'tablet' || device === 'mobile') {
            if (!animatedCell || !isAnimating) return false;
            
            const isCenter = animatedCell.row === row && animatedCell.col === col;
            // Изменено: только соседи по горизонтали (та же строка, соседние колонки)
            const isHorizontalNeighbor = row === animatedCell.row && Math.abs(col - animatedCell.col) === 1;
            
            return isCenter || isHorizontalNeighbor;
        }

        // на десктопе размер задаёт волна (см. эффект выше)
        return false;
    };

    const getScalePercent = (row: number, col: number): number => {
        if (!shouldScale(row, col)) return 0;
        
        if (device === 'tablet' || device === 'mobile') {
            if (animatedCell && animatedCell.row === row && animatedCell.col === col) {
                return 100;
            }

            if (animatedCell) {
                // Изменено: только горизонтальные соседи
                const isHorizontalNeighbor = row === animatedCell.row && Math.abs(col - animatedCell.col) === 1;
                if (isHorizontalNeighbor) {
                    return 50;
                }
            }
            return 0;
        }

        return 0;
    };

    const renderCellContent = (row: number, col: number) => {
        if (row === 0 && col === 0) {
            return (
                <div className='block-with-u-animate-logo-wave' data-wave-letter data-wave-logo>
                    <Image
                        src={Logo}
                        alt=''
                        height={21}
                        className='block-with-u-animate-logo-icon'
                        unoptimized
                    />
                </div>
            );
        }

        if (
            (device === 'desktop' && row === 2 && col === columns - 5) ||
            (device === 'desktop_s' && row === 2 && col === 5) ||
            (device === 'tablet' && row === 3 && col === 3) ||
            (device === 'mobile' && row === 3 && col === 1)
        ) {
            return (
                <div className={`special-cell special-cell-third-row ${FONT_MONT_BOOK.className}`}>
                    масштаб идей, людей и теплых связей
                </div>
            );
        }

        const scalePercent = getScalePercent(row, col);
        
        let svgWidth = 20;
        let svgHeight = 21;
        
        if (scalePercent === 100) {
            svgWidth = 40;
            svgHeight = 42;
        } else if (scalePercent === 50) {
            svgWidth = 30;
            svgHeight = 31.5;
        }

        const isVisibleB = () => {
            switch(device) {
                case 'desktop':
                    return row === 4 && col === columns - 1;
                case 'desktop_s':
                    return row === 4 && col === 9;
                case 'tablet':
                    return row === 6 && col === 9;
                case 'mobile':
                    return row === 6 && col === 5;
                default:
                    return false;
            }
        }

        return (
            <div className="block-with-u-animate-svg-container" data-wave-letter>
                {isVisibleB() ? (
                    <Image
                        src={B}
                        alt=''
                        width={20}
                        height={21}
                        className='block-with-u-animate-svg-icon'
                        style={{
                            width: svgWidth,
                            height: svgHeight,
                        }}
                        unoptimized
                    />
                ) : (
                    <Image
                        src={U}
                        alt=''
                        width={20}
                        height={21}
                        className='block-with-u-animate-svg-icon'
                        style={{
                            width: svgWidth,
                            height: svgHeight,
                        }}
                        unoptimized
                    />
                )}
            </div>
        );
    };

    // Первый ряд на десктопе как в макете: логотип SOUTHU слева, а за ним на одну букву
    // больше, чем столбцов до правого края; буквы равномерно занимают оставшуюся ширину.
    const getRowCells = (row: number) => {
        if (device === 'desktop_s') {
            if (row === 0) {
                return [
                    { type: 'special', col: 0, span: 1 },
                    ...Array.from({ length: columns - 1 }, (_, i) => ({ type: 'svg', col: i + 1, span: 1 }))
                ];
            } else if (row === 2) {
                return [
                    ...Array.from({ length: columns - 5 }, (_, i) => ({ type: 'svg', col: i, span: 1 })),
                    { type: 'special', col: columns - 5, span: 4 },
                    { type: 'svg', col: columns - 1, span: 1 }
                ];
            } else {
                return Array.from({ length: columns }, (_, i) => ({ type: 'svg', col: i, span: 1 }));
            }
        }

        if (device === 'tablet') {
            if (row === 0) {
                return [
                    { type: 'special', col: 0, span: 2 },
                    ...Array.from({ length: columns - 2 }, (_, i) => ({ type: 'svg', col: i + 2, span: 1 }))
                ];
            } else if (row === 3) {
                return [
                    ...Array.from({ length: columns - 7 }, (_, i) => ({ type: 'svg', col: i, span: 1 })),
                    { type: 'special', col: columns - 7, span: 6 },
                    { type: 'svg', col: columns - 1, span: 1 }
                ];
            } else {
                return Array.from({ length: columns }, (_, i) => ({ type: 'svg', col: i, span: 1 }));
            }
        }

        if (device === 'mobile') {
            if (row === 0) {
                return [
                    { type: 'special', col: 0, span: 2 },
                    ...Array.from({ length: columns - 2 }, (_, i) => ({ type: 'svg', col: i + 2, span: 1 }))
                ];
            } else if (row === 3) {
                return [
                    ...Array.from({ length: columns - 5 }, (_, i) => ({ type: 'svg', col: i, span: 1 })),
                    { type: 'special', col: columns - 5, span: 5 },
                ];
            } else {
                return Array.from({ length: columns }, (_, i) => ({ type: 'svg', col: i, span: 1 }));
            }
        }

        if (row === 0) {
            return [
                { type: 'special', col: 0, span: 1 },
                ...Array.from({ length: columns - 1 }, (_, i) => ({ type: 'svg', col: i + 1, span: 1 }))
            ];
        } else if (row === 2) {
            return [
                ...Array.from({ length: columns - 5 }, (_, i) => ({ type: 'svg', col: i, span: 1 })),
                { type: 'special', col: columns - 5, span: 4 },
                { type: 'svg', col: columns - 1, span: 1 }
            ];
        } else {
            return Array.from({ length: columns }, (_, i) => ({ type: 'svg', col: i, span: 1 }));
        }
    };

    return (
        <div
            className="block-with-u-animate"
            id='block-with-u-animate'
            ref={blockRef}
            style={device === 'desktop' ? ({ '--u-columns': columns } as CSSProperties) : undefined}
        >
            {rowGrid[device].map((row) => {
                const rowCells = getRowCells(row);
                
                return (
                    <div
                        key={row}
                        className={`block-with-u-animate-row block-with-u-animate-row-${row}`}
                    >
                        {rowCells.map((cell, index) => (
                            <div
                                key={`${row}-${cell.col}-${index}`}
                                className={`block-with-u-animate-cell ${
                                    cell.type === 'special' ? 'special-cell-wrapper' : ''
                                }`}
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
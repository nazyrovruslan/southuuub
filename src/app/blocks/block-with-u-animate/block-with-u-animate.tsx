import { useEffect, useRef, useState, type CSSProperties } from 'react';

import './block-with-u-animate.css';
import { FONT_MONT_BOOK } from '@/app/fonts';
import Image from 'next/image';
import U from '../../../../public/v2/animate-u.svg';
import B from '../../../../public/v2/animate-b.svg';

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
const WAVE_LOGO_GAP = 8;         // логотип SOUTHU раздвигается вправо, но не ближе этого к соседней U
const WAVE_RADIUS = 1.1;        // радиус влияния в шагах сетки по горизонтали
const WAVE_GROW = 0.22;         // скорость увеличения за кадр (быстро)
const WAVE_FADE = 0.06;         // скорость затухания за кадр (медленно)

// Логотип SOUTHU по буквам (из animate-u-block-logo.svg): каждая буква участвует в волне отдельно
const LOGO_LETTERS = [
    { x: 0, width: 15.33, d: 'M8.43399 6.45775C6.62166 6.09479 5.05743 5.7811 5.05743 4.90736C5.05743 4.03363 6.01043 3.37997 7.37255 3.37997C9.54143 3.37997 9.91277 4.62816 9.97685 5.0601C9.98342 5.09952 9.98506 5.13237 9.98835 5.157L10.0196 5.4362H14.5939V5.20299C14.5939 4.34239 14.2456 0.0525671 7.37255 0.0525671C3.27797 0.0525671 0.305615 2.21883 0.305615 5.20299C0.305615 8.81945 3.80376 9.47803 6.61344 10.0069C8.59008 10.378 10.2956 10.6999 10.2956 11.8808C10.2956 12.5065 9.95549 13.5576 7.67816 13.5576C4.88162 13.5576 4.63187 11.572 4.60887 11.1992V11.1926C4.60887 11.1861 4.60887 11.1812 4.60887 11.1762L4.59901 10.9742H0V11.1385C0 11.7264 0.215245 16.8834 7.67488 16.8834C12.1539 16.8834 15.0491 14.7451 15.0491 11.4357C15.0491 7.78641 11.3817 7.05063 8.43563 6.45939L8.43399 6.45775Z' },
    { x: 15.33, width: 16.23, d: 'M23.2497 0C18.5143 0 15.3317 3.38161 15.3317 8.41378C15.3317 13.4459 18.5143 16.8276 23.2497 16.8276C27.9851 16.8276 31.1678 13.4459 31.1678 8.41378C31.1678 3.38161 27.9851 0 23.2497 0ZM26.6213 8.41542C26.6213 9.85576 26.2927 13.2062 23.2497 13.2062C20.2067 13.2062 19.8764 9.85576 19.8764 8.41542C19.8764 6.97508 20.2051 3.62467 23.2497 3.62467C26.2944 3.62467 26.6213 6.97508 26.6213 8.41542Z' },
    { x: 31.56, width: 15.62, d: 'M39.0891 17C36.7263 17 34.8812 16.3529 33.5535 15.0571C32.2276 13.7613 31.5638 11.9251 31.5638 9.547V0.67665H36.0921V9.40904C36.0921 10.7804 36.3632 11.7642 36.9038 12.3587C37.4444 12.9532 38.1887 13.2505 39.1335 13.2505C40.0783 13.2505 40.8176 12.9532 41.3516 12.3587C41.8857 11.7642 42.1518 10.7821 42.1518 9.40904V0.67665H46.6112V9.547C46.6112 11.9251 45.9474 13.7613 44.6214 15.0571C43.2954 16.3529 41.4502 17 39.0858 17H39.0891Z' },
    { x: 47.18, width: 15.72, d: 'M62.2271 0.678293H47.1781V3.94165H52.2437V16.256H56.8066V3.94165H62.2271V0.678293Z' },
    { x: 62.9, width: 15.78, d: 'M73.4938 0.678293V6.76486H67.4324V0.678293H62.9041V16.256H67.4324V10.0233H73.4938V16.256H77.9532V0.678293H73.4938Z' },
    { x: 78.68, width: 15.32, d: 'M86.2015 17C83.8387 17 81.9935 16.3529 80.6659 15.0571C79.3399 13.7613 78.6761 11.9251 78.6761 9.547V0.67665H83.2045V9.40904C83.2045 10.7804 83.4756 11.7642 84.0162 12.3587C84.5567 12.9532 85.3011 13.2505 86.2458 13.2505C87.1906 13.2505 87.93 12.9532 88.464 12.3587C88.998 11.7642 89.2642 10.7821 89.2642 9.40904V0.67665H93.7235V9.547C93.7235 11.9251 93.0597 13.7613 91.7338 15.0571C90.4078 16.3529 88.5626 17 86.1982 17H86.2015Z' },
];

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
        const isLogo = icons.map((icon) => icon.dataset.waveLogo !== undefined);
        const logo = block.querySelector<HTMLElement>('.block-with-u-animate-logo-wave');
        const current = icons.map(() => 1);
        const target = icons.map(() => 1);
        let frame = 0;

        const tick = () => {
            let moving = false;
            // буквы логотипа растут от левого края и раздвигают следующие за ними
            let logoShift = 0;
            icons.forEach((icon, i) => {
                const diff = target[i] - current[i];
                if (Math.abs(diff) < 0.002) {
                    current[i] = target[i];
                } else {
                    current[i] += diff * (diff > 0 ? WAVE_GROW : WAVE_FADE);
                    moving = true;
                }
                if (isLogo[i]) {
                    icon.style.transform = current[i] === 1 && logoShift === 0
                        ? ''
                        : `translateX(${logoShift.toFixed(2)}px) scale(${current[i].toFixed(3)})`;
                    logoShift += icon.offsetWidth * (current[i] - 1);
                    return;
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
                if (isLogo[i] || isLogo[i - 1]) continue;
                const dx = Math.abs(centers[i][0] - centers[i - 1][0]);
                if (dx > 1 && Math.abs(centers[i][1] - centers[i - 1][1]) < 1) pitch = Math.min(pitch, dx);
            }
            const radius = (Number.isFinite(pitch) ? pitch : 150) * WAVE_RADIUS;

            const logoRect = logo?.getBoundingClientRect();
            let logoGrowth = 0;

            centers.forEach(([cx, cy], i) => {
                const icon = icons[i];
                if (isLogo[i] && logoRect) {
                    // буква логотипа: расстояние до её центра без сдвига и масштаба
                    const lx = logoRect.left + icon.offsetLeft + icon.offsetWidth / 2;
                    const ly = logoRect.top + icon.offsetTop + icon.offsetHeight / 2;
                    const d = Math.hypot(event.clientX - lx, event.clientY - ly) / radius;
                    target[i] = 1 + (WAVE_MAX_SCALE - 1) * Math.exp(-d * d);
                    logoGrowth += icon.offsetWidth * (target[i] - 1);
                    return;
                }
                const d = Math.hypot(event.clientX - cx, event.clientY - cy) / radius;
                target[i] = 1 + (WAVE_MAX_SCALE - 1) * Math.exp(-d * d);
            });

            // логотип не должен наезжать на соседнюю U: если места не хватает, все его буквы растут меньше
            const nextU = icons.findIndex((icon, i) => !isLogo[i] && logoRect && Math.abs(centers[i][1] - (logoRect.top + logoRect.height / 2)) < logoRect.height);
            if (logoRect && nextU !== -1 && logoGrowth > 0) {
                // левый край соседней U с учётом её будущего масштаба (она растёт от центра)
                const nextULeft = centers[nextU][0] - icons[nextU].offsetWidth * target[nextU] / 2;
                const room = Math.max(nextULeft - WAVE_LOGO_GAP - logoRect.right, 0);
                if (logoGrowth > room) {
                    const k = room / logoGrowth;
                    icons.forEach((_, i) => {
                        if (isLogo[i]) target[i] = 1 + (target[i] - 1) * k;
                    });
                }
            }
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
                <div className='block-with-u-animate-logo-wave' role='img' aria-label='SOUTHU'>
                    {LOGO_LETTERS.map((letter, i) => (
                        <span
                            key={i}
                            className='block-with-u-animate-logo-letter'
                            style={{ '--logo-letter-ratio': letter.width / 18 } as CSSProperties}
                            data-wave-letter
                            data-wave-logo
                        >
                            <svg
                                className='block-with-u-animate-logo-icon'
                                viewBox={`${letter.x} 0 ${letter.width} 18`}
                                width={letter.width * 21 / 18}
                                height={21}
                                fill='none'
                                aria-hidden='true'
                            >
                                <path d={letter.d} fill='white' />
                            </svg>
                        </span>
                    ))}
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
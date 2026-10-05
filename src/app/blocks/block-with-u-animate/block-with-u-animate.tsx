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

// Волна: каждая буква увеличивается по расстоянию от неё до курсора (на телефоне — до пальца),
// поэтому вместе с наведённой растут соседи по бокам, сверху и снизу, а зона
// наведения непрерывная — каждая буква «ловит» курсор до середины пути к соседней.
const WAVE_MAX_SCALE = 2;       // наведённая буква: 20px -> 40px, как раньше
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
        const block = blockRef.current;
        if (!block) return;
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

        const wave = (point: { clientX: number; clientY: number }) => {
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
                const d = Math.hypot(point.clientX - cx, point.clientY - cy) / radius;
                target[i] = 1 + (WAVE_MAX_SCALE - 1) * Math.exp(-d * d);
            });
            run();
        };
        const onLeave = () => {
            target.fill(1);
            run();
        };

        const onMove = (event: PointerEvent) => {
            if (event.pointerType !== 'touch') wave(event);
        };

        // Телефон: волна идёт за пальцем, в том числе пока страница прокручивается
        const onTouch = (event: TouchEvent) => {
            if (event.touches[0]) wave(event.touches[0]);
        };

        block.addEventListener('pointermove', onMove);
        block.addEventListener('pointerleave', onLeave);
        block.addEventListener('touchstart', onTouch, { passive: true });
        block.addEventListener('touchmove', onTouch, { passive: true });
        block.addEventListener('touchend', onLeave);
        block.addEventListener('touchcancel', onLeave);
        return () => {
            block.removeEventListener('pointermove', onMove);
            block.removeEventListener('pointerleave', onLeave);
            block.removeEventListener('touchstart', onTouch);
            block.removeEventListener('touchmove', onTouch);
            block.removeEventListener('touchend', onLeave);
            block.removeEventListener('touchcancel', onLeave);
            cancelAnimationFrame(frame);
            icons.forEach((icon) => { icon.style.transform = ''; });
        };
    }, [device, desktopColumns]);

    const columns = device === 'desktop' ? desktopColumns : columnGrid[device];

    const renderCellContent = (row: number, col: number) => {
        if (row === 0 && col === 0) {
            return (
                <Image
                    src={Logo}
                    alt=''
                    height={21}
                    className='block-with-u-animate-logo-icon'
                    unoptimized
                />
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
                        unoptimized
                    />
                ) : (
                    <Image
                        src={U}
                        alt=''
                        width={20}
                        height={21}
                        className='block-with-u-animate-svg-icon'
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
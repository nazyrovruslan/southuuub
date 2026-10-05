import { useEffect, useState } from 'react';

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
    const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);
    const [animatedCell, setAnimatedCell] = useState<{ row: number; col: number } | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);

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

    const isSpecialCell = (row: number, col: number): boolean => {
        if (row === 0 && col === 0) return true;

        switch(device) {
            case 'desktop':
                return row === 2 && col === 7;
            case 'desktop_s':
                return row === 2 && col === 5;
            case 'tablet':
                return row === 3 && col === 3;
            case 'mobile':
                return row === 3 && col === 1;
            default:
                return false;
        }
    };

    const shouldScale = (row: number, col: number): boolean => {
        if (device === 'tablet' || device === 'mobile') {
            if (!animatedCell || !isAnimating) return false;
            
            const isCenter = animatedCell.row === row && animatedCell.col === col;
            // Изменено: только соседи по горизонтали (та же строка, соседние колонки)
            const isHorizontalNeighbor = row === animatedCell.row && Math.abs(col - animatedCell.col) === 1;
            
            return isCenter || isHorizontalNeighbor;
        }

        if (!hoveredCell) return false;
        
        const { row: hoverRow, col: hoverCol } = hoveredCell;
        
        if (isSpecialCell(hoverRow, hoverCol)) {
            return false;
        }
        
        // Изменено: только соседи по горизонтали (та же строка, соседние колонки)
        const isHorizontalNeighbor = row === hoverRow && Math.abs(col - hoverCol) === 1;
        
        if (isHorizontalNeighbor && isSpecialCell(row, col)) {
            return false;
        }
        
        return isHorizontalNeighbor;
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

        if (!hoveredCell) return 0;
        
        // Изменено: только горизонтальные соседи
        const isHorizontalNeighbor = row === hoveredCell.row && Math.abs(col - hoveredCell.col) === 1;
        
        if (isHorizontalNeighbor) {
            return 50;
        }
        
        if (hoveredCell.row === row && hoveredCell.col === col) {
            return 100;
        }
        
        return 0;
    };

    const isHovered = (row: number, col: number): boolean => {
        if (device === 'tablet' || device === 'mobile') {
            return false;
        }
        
        if (!hoveredCell) {
            return false;
        }

        return hoveredCell.row === row && hoveredCell.col === col;
    };

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
            (device === 'desktop' && row === 2 && col === 7) ||
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
        const isCurrentlyHovered = isHovered(row, col);
        
        let svgWidth = 20;
        let svgHeight = 21;
        
        if (scalePercent === 100) {
            svgWidth = 40;
            svgHeight = 42;
        } else if (scalePercent === 50) {
            svgWidth = 30;
            svgHeight = 31.5;
        } else if (isCurrentlyHovered) {
            svgWidth = 40;
            svgHeight = 42;
        }

        const isVisibleB = () => {
            switch(device) {
                case 'desktop':
                    return row === 4 && col === 11;
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
            <div className="block-with-u-animate-svg-container">
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

    const getRowCells = (row: number) => {
        if (device === 'desktop_s') {
            if (row === 0) {
                return [
                    { type: 'special', col: 0, span: 2 },
                    ...Array.from({ length: columnGrid[device] - 2 }, (_, i) => ({ type: 'svg', col: i + 2, span: 1 }))
                ];
            } else if (row === 2) {
                return [
                    ...Array.from({ length: columnGrid[device] - 5 }, (_, i) => ({ type: 'svg', col: i, span: 1 })),
                    { type: 'special', col: columnGrid[device] - 5, span: 4 },
                    { type: 'svg', col: columnGrid[device] - 1, span: 1 }
                ];
            } else {
                return Array.from({ length: columnGrid[device] }, (_, i) => ({ type: 'svg', col: i, span: 1 }));
            }
        }

        if (device === 'tablet') {
            if (row === 0) {
                return [
                    { type: 'special', col: 0, span: 2 },
                    ...Array.from({ length: columnGrid[device] - 2 }, (_, i) => ({ type: 'svg', col: i + 2, span: 1 }))
                ];
            } else if (row === 3) {
                return [
                    ...Array.from({ length: columnGrid[device] - 7 }, (_, i) => ({ type: 'svg', col: i, span: 1 })),
                    { type: 'special', col: columnGrid[device] - 7, span: 6 },
                    { type: 'svg', col: columnGrid[device] - 1, span: 1 }
                ];
            } else {
                return Array.from({ length: columnGrid[device] }, (_, i) => ({ type: 'svg', col: i, span: 1 }));
            }
        }

        if (device === 'mobile') {
            if (row === 0) {
                return [
                    { type: 'special', col: 0, span: 2 },
                    ...Array.from({ length: columnGrid[device] - 2 }, (_, i) => ({ type: 'svg', col: i + 2, span: 1 }))
                ];
            } else if (row === 3) {
                return [
                    ...Array.from({ length: columnGrid[device] - 5 }, (_, i) => ({ type: 'svg', col: i, span: 1 })),
                    { type: 'special', col: columnGrid[device] - 5, span: 5 },
                ];
            } else {
                return Array.from({ length: columnGrid[device] }, (_, i) => ({ type: 'svg', col: i, span: 1 }));
            }
        }

        if (row === 0) {
            return [
                { type: 'special', col: 0, span: 2 },
                ...Array.from({ length: columnGrid[device] - 2 }, (_, i) => ({ type: 'svg', col: i + 2, span: 1 }))
            ];
        } else if (row === 2) {
            return [
                ...Array.from({ length: columnGrid[device] - 5 }, (_, i) => ({ type: 'svg', col: i, span: 1 })),
                { type: 'special', col: columnGrid[device] - 5, span: 4 },
                { type: 'svg', col: columnGrid[device] - 1, span: 1 }
            ];
        } else {
            return Array.from({ length: columnGrid[device] }, (_, i) => ({ type: 'svg', col: i, span: 1 }));
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
        <div className="block-with-u-animate" id='block-with-u-animate'>
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
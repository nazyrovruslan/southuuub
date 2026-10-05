/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';

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

const FIXED_CELLS: Record<'tablet' | 'mobile', { row: number; col: number }[]> = {
    tablet: [{ row: 1, col: 1 }, { row: 2, col: 5 }, { row: 5, col: 3 }],
    mobile: [{ row: 1, col: 1 }, { row: 2, col: 3 }, { row: 5, col: 2 }],
};

export const MoreNew = () => {
    const [device, setDevice] = useState<'desktop' | 'desktop_s' | 'tablet' | 'mobile'>('desktop');
    const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);
    const [fixedCells, setFixedCells] = useState<{ row: number; col: number }[]>([]);
    const [isMobileVisible, setMobileVisible] = useState(false);

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
                    className="more-new-svg-icon"
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

    const getRowCells = (row: number) => {
        if (row === 3) {
            if (device === 'desktop_s') {
                return [
                    { type: 'svg', col: 0, span: 1 },
                    { type: 'special', col: 1, span: 7 },
                    ...Array.from({ length: columnGrid[device] - 8 }, (_, i) => ({ type: 'svg', col: i + 8, span: 1 })),
                ];
            }

            if (device === 'tablet') {
                return [
                    { type: 'svg', col: 0, span: 1 },
                    { type: 'special', col: 1, span: 5 },
                    ...Array.from({ length: columnGrid[device] - 5 }, (_, i) => ({ type: 'svg', col: i + 5, span: 1 })),
                ];
            }

            if (device === 'mobile') {
                return [{ type: 'special', col: 0, span: 5 }];
            }

            return [
                { type: 'svg', col: 0, span: 1 },
                { type: 'special', col: 1, span: 7 },
                ...Array.from({ length: columnGrid[device] - 8 }, (_, i) => ({ type: 'svg', col: i + 8, span: 1 })),
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
        <div className="more-new" id="more-new">
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

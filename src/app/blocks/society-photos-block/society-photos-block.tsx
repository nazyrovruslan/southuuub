'use client';

import { useCallback, useEffect, useState } from 'react';
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

// У букв 4 положения: 0 — основной экран, 1–3 — для фотографий (по макету),
// поэтому фотографии используют только положения 1–3.
const ANIMATION_SEQUENCE = [1, 2, 1, 3, 1, 2, 1, 3, 1, 2, 3, 2, 1, 3];

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
    const [imgNumber, setImgNumber] = useState(0);
    // После первой смены фото буквы анимируются: старая уезжает из своей клетки, новая заезжает
    const [hasChanged, setHasChanged] = useState(false);
    const [device, setDevice] = useState('desktop');

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

    useEffect(() => {
        const interval = setInterval(() => {
            setHasChanged(true);
            setImgNumber((prev) => prev === 13 ? 0 : prev + 1)
        }, 2000);

        return () => {
            clearInterval(interval);
        };
    }, []);

    const getCellContent = useCallback((x: number, y: number, configIdx: number) => {
        if (device === 'tablet') {
            return TABLET_CELL_POSITIONS[ANIMATION_SEQUENCE[configIdx]].find(c => c.x === x && c.y === y);
        }

        if (device === 'mobile') {
            return MOBILE_CELL_POSITIONS[ANIMATION_SEQUENCE[configIdx]].find(c => c.x === x && c.y === y);
        }

        return DESKTOP_CELL_POSITIONS[ANIMATION_SEQUENCE[configIdx]].find(c => c.x === x && c.y === y);
    }, [device]);

    const renderGrid = useCallback(() => {
        const rows = device === 'tablet' ? 6 : device === 'mobile' ? 9 : 5;
        const cols = device === 'tablet' ? 5 : device === 'mobile' ? 5 : 7;
        const grid = [];
        const prevNumber = (imgNumber + ANIMATION_SEQUENCE.length - 1) % ANIMATION_SEQUENCE.length;

        // Создаем карту colSpan для текущей и следующей конфигурации
        const colSpanMap = new Map();
        
        if (device === 'mobile') {
            const currentConfig = MOBILE_CELL_POSITIONS[ANIMATION_SEQUENCE[imgNumber]];
            const prevConfig = hasChanged ? MOBILE_CELL_POSITIONS[ANIMATION_SEQUENCE[prevNumber]] : [];
            
            // Отмечаем ячейки с colSpan
            [...(currentConfig || []), ...(prevConfig || [])].forEach(cell => {
                if (cell.colSpan === 2) {
                    colSpanMap.set(`${cell.x}-${cell.y}`, cell.colSpan);
                    // Отмечаем, что ячейка справа должна быть скрыта
                    colSpanMap.set(`${cell.x + 1}-${cell.y}`, 'hidden');
                }
            });
        }

        for (let y = 0; y < rows; y++) {
            const row = [];
            // Рассчитываем общий вес колонок в ряду
            let totalFlexWeight = cols;
            
            for (let x = 0; x < cols; x++) {
                const cellKey = `${x}-${y}`;
                const colSpanValue = colSpanMap.get(cellKey);
                
                // Пропускаем скрытые ячейки (они будут отрендерены как часть colSpan)
                if (colSpanValue === 'hidden') {
                    continue;
                }
                
                // Определяем flex вес для ячейки
                let flexWeight = 1;
                if (colSpanValue === 2) {
                    flexWeight = 2;
                    totalFlexWeight += 1; // Увеличиваем общий вес, так как мы добавляем +1 к flex
                }
                
                const currentCell = getCellContent(x, y, imgNumber);
                const prevCell = hasChanged ? getCellContent(x, y, prevNumber) : undefined;
                
                // Для ячеек с colSpan убираем правую границу
                const showBorderRight = x < cols - 1 && colSpanValue !== 2;
                const showBorderBottom = y < rows - 1;
                
                // Буква меняется только внутри своей клетки: прежняя уезжает вниз за границу клетки,
                // новая заезжает сверху. Клетка обрезает всё, что выходит за её контур.
                const shouldAnimate = JSON.stringify(currentCell ?? null) !== JSON.stringify(prevCell ?? null);
                const outgoingCell = shouldAnimate ? prevCell : undefined;
                const isActive = currentCell || outgoingCell;
                
                row.push(
                    <div
                        key={cellKey}
                        className={`society-grid-cell ${!showBorderRight ? 'no-border-right' : ''} ${!showBorderBottom ? 'no-border-bottom' : ''}`}
                        style={{ flex: flexWeight }}
                    >
                        {isActive && (
                            <div
                                key={shouldAnimate ? `animating-${imgNumber}` : 'static'}
                                className={`cell-flip-container ${shouldAnimate ? 'animating' : ''}`}
                            >
                                {currentCell && (
                                    <div className="cell-content current">
                                        {currentCell.type === 'text' ? (
                                            <div className={`text-cell ${FONT_MONT_BOOK.className}`}>
                                                {currentCell.text}
                                            </div>
                                        ) : (
                                            currentCell.src === 'WordS' && <IconS className='society-cell-img' /> ||
                                            currentCell.src === 'WordO' && <IconO className='society-cell-img' /> ||
                                            currentCell.src === 'WordU' && <IconU className='society-cell-img' /> ||
                                            currentCell.src === 'WordT' && <IconT className='society-cell-img' /> ||
                                            currentCell.src === 'WordH' && <IconH className='society-cell-img' /> ||
                                            currentCell.src === 'WordB' && <IconB className='society-cell-img' />
                                        )}
                                    </div>
                                )}

                                {outgoingCell && (
                                    <div className="cell-content prev">
                                        {outgoingCell.type === 'text' ? (
                                            <div className={`text-cell ${FONT_MONT_BOOK.className}`}>
                                                {outgoingCell.text}
                                            </div>
                                        ) : (
                                            outgoingCell.src === 'WordS' && <IconS className='society-cell-img' /> ||
                                            outgoingCell.src === 'WordO' && <IconO className='society-cell-img' /> ||
                                            outgoingCell.src === 'WordU' && <IconU className='society-cell-img' /> ||
                                            outgoingCell.src === 'WordT' && <IconT className='society-cell-img' /> ||
                                            outgoingCell.src === 'WordH' && <IconH className='society-cell-img' /> ||
                                            outgoingCell.src === 'WordB' && <IconB className='society-cell-img' />
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {(
                            (device === 'desktop' && y === 4 && x === 3) ||
                            (device === 'tablet' && y === 5 && x === 2) ||
                            (device === 'mobile' && y === 8 && x === 2)
                        ) && (
                            <div className={`${FONT_IBM_PLEX_SERIF_LIGHT.className} cell-content-count`}>
                                {`${imgNumber + 1}/${14}`}
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
    }, [getCellContent, imgNumber, hasChanged, device]);

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
        <div className='society-photos-block-wrapper' id='society-photos-block'>
            <div className='society-photos-block-img-wrapper'>
                <Image src={SocietyPhoto1} sizes='100vw' alt='' className={`society-photos-block-img society-photos-block-img-${imgNumber === 0 ? 'visible' : 'hidden'}`} />
                <Image src={SocietyPhoto2} sizes='100vw' alt='' className={`society-photos-block-img society-photos-block-img-${imgNumber === 1 ? 'visible' : 'hidden'}`} />
                <Image src={SocietyPhoto3} sizes='100vw' alt='' className={`society-photos-block-img society-photos-block-img-${imgNumber === 2 ? 'visible' : 'hidden'}`} />
                <Image src={SocietyPhoto4} sizes='100vw' alt='' className={`society-photos-block-img society-photos-block-img-${imgNumber === 3 ? 'visible' : 'hidden'}`} />
                <Image src={SocietyPhoto5} sizes='100vw' alt='' className={`society-photos-block-img society-photos-block-img-${imgNumber === 4 ? 'visible' : 'hidden'}`} />
                <Image src={SocietyPhoto6} sizes='100vw' alt='' className={`society-photos-block-img society-photos-block-img-${imgNumber === 5 ? 'visible' : 'hidden'}`} />
                <Image src={SocietyPhoto7} sizes='100vw' alt='' className={`society-photos-block-img society-photos-block-img-${imgNumber === 6 ? 'visible' : 'hidden'}`} />
                <Image src={SocietyPhoto8} sizes='100vw' alt='' className={`society-photos-block-img society-photos-block-img-${imgNumber === 7 ? 'visible' : 'hidden'}`} />
                <Image src={SocietyPhoto9} sizes='100vw' alt='' className={`society-photos-block-img society-photos-block-img-${imgNumber === 8 ? 'visible' : 'hidden'}`} />
                <Image src={SocietyPhoto10} sizes='100vw' alt='' className={`society-photos-block-img society-photos-block-img-${imgNumber === 9 ? 'visible' : 'hidden'}`} />
                <Image src={SocietyPhoto11} sizes='100vw' alt='' className={`society-photos-block-img society-photos-block-img-${imgNumber === 10 ? 'visible' : 'hidden'}`} />
                <Image src={SocietyPhoto12} sizes='100vw' alt='' className={`society-photos-block-img society-photos-block-img-${imgNumber === 11 ? 'visible' : 'hidden'}`} />
                <Image src={SocietyPhoto13} sizes='100vw' alt='' className={`society-photos-block-img society-photos-block-img-${imgNumber === 12 ? 'visible' : 'hidden'}`} />
                <Image src={SocietyPhoto14} sizes='100vw' alt='' className={`society-photos-block-img society-photos-block-img-${imgNumber === 13 ? 'visible' : 'hidden'}`} />
            </div>
            
            <div className='society-photos-block-grid-wrapper'>
                {renderGrid()}
            </div>
        </div>
    );
};
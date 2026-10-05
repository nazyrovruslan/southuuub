import { FONT_MONT_BOOK } from '../../fonts';

import './how-become-community-block.css';
import { AccesibleButton } from './how-become-community-block-button';
import { NBSP } from '@/app/constants';
import { useEffect } from 'react';

export const HowBecomeCommunityBlock = () => {
    useEffect(() => {
        const header = document.querySelector('#header');
        const targetBlock = document.querySelector('#how-become-community-block');
        
        if (!header || !targetBlock) return;

        let lastScrollY = window.scrollY;
        let isHeaderBlack = false;

        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            const blockRect = targetBlock.getBoundingClientRect();
            const blockTop = blockRect.top;
            const isScrollingUp = currentScrollY < lastScrollY;
    
            if (blockTop <= 0) {
                if (!isHeaderBlack) {
                    header.classList.add('header_black');
                    isHeaderBlack = true;
                }
            } 
            else if (isScrollingUp && blockTop <= 50) {
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

    return (
        <div className='how-become-community-block-wrapper' id='how-become-community-block'>
            <h3
                className={`${FONT_MONT_BOOK.className} how-become-community-block-title`}
            >
                {`стать частью\nсообщества`}
            </h3>

            <p
                className={`${FONT_MONT_BOOK.className} how-become-community-block-description`}
            >
                {`мы заботливо формируем наше\nсообщество, чтобы вы в${NBSP}нём чувствовали\nсебя комфортно и${NBSP}усиливали друг друга. поэтому очень внимательно относимся\nк модерации каждой заявки.`}
            </p>

            <AccesibleButton />
        </div>
    );
}
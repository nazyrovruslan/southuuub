'use client';
import Image from 'next/image';
import { useEffect } from 'react';

import Logo from '../../../../public/v2/header-logo-white.svg';
import LogoBlack from '../../../../public/v2/footer/footer-logo-black.svg';
import { HeaderItem } from './header-item';

import './header.css';
import { HeaderBurger } from './header-burger';
import { useGetLinkWithUtm } from '@/app/hooks/use-get-link-with-utm';
import { LK_LOGIN_LINK } from '@/app/constants';

// Сколько пикселей прокрутки нужно в одну сторону, чтобы шапка вернулась или снова спряталась
const PEEK_DELTA = 8;

export const Header = () => {
    const getLinkWIthUtm = useGetLinkWithUtm();

    // После начала прокрутки шапке нужна подложка, иначе на телефонах она лежит прямо на тексте.
    // Прокрутка вверх всегда возвращает шапку, даже там, где блоки её прячут (header_peek).
    useEffect(() => {
        const header = document.getElementById('header');
        if (!header) return;

        let lastY = window.scrollY;
        const update = () => {
            const y = window.scrollY;
            header.classList.toggle('header_scrolled', y > 10);
            if (y <= 10 || y - lastY > PEEK_DELTA) {
                header.classList.remove('header_peek');
            } else if (lastY - y > PEEK_DELTA) {
                header.classList.add('header_peek');
            } else {
                return;
            }
            lastY = y;
        };
        update();
        window.addEventListener('scroll', update, { passive: true });
        return () => window.removeEventListener('scroll', update);
    }, []);

    const handleScrollIntoView = () => {
        const element = document.getElementById('header');

        if (element) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    return (
        <div className='header header_desktop' id='header'>
            <div className='header_desktop_wrapper'>
                <div className='header-logo'>
                    <Image
                        src={Logo}
                        alt="SOUTHUUUB"
                        width={180}
                        height={21}
                        onClick={handleScrollIntoView}
                        style={{ cursor: 'pointer' }}
                        className='header-logo-white'
                        unoptimized
                    />
                    <Image
                        src={LogoBlack}
                        alt="SOUTHUUUB"
                        width={180}
                        height={21}
                        onClick={handleScrollIntoView}
                        style={{ cursor: 'pointer' }}
                        className='header-logo-black'
                        unoptimized
                    />

                    <HeaderBurger />
                </div>

                <div className='header-items'>
                    <HeaderItem id='btn_lending_header_item_southub' title='south hub camp' link={getLinkWIthUtm('https://southhub.ru/southub/')} />
                    <HeaderItem id='btn_lending_header_item_our_project' title='где встречаемся' intoScroll='our-projects-block' />
                    <HeaderItem id='btn_lending_header_item_login' title='войти' link={getLinkWIthUtm(LK_LOGIN_LINK)} />
                </div>
            </div>
        </div>
    );
}
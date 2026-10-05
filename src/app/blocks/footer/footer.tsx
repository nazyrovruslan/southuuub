'use client';

import { FONT_MONT_BOOK } from '../../fonts';
import Logo from '../../../../public/v2/footer/footer-logo-black.svg';
import Telegram from '../../../../public/v2/footer/telegram.svg';
import Youtube from '../../../../public/v2/footer/youtube.svg';
import LinkedIn from '../../../../public/v2/footer/linkedin.svg';

import './footer.css';
import Image from 'next/image';
import { SOUTHHUB_CONFIDENTIAL_LINK, SOUTHHUB_COOKIES_LINK, SOUTHHUB_LINKEDIN, SOUTHHUB_PD_LINK, SOUTHHUB_TELEGRAM, SOUTHHUB_YOUTUBE, TELEGRAM_CHANELL_LINK } from '@/app/constants';
import { useGetLinkWithUtm } from '@/app/hooks/use-get-link-with-utm';

export const Footer = () => {
    const getLinkWithUtm = useGetLinkWithUtm();

    return (
        <div className='footer' id='footer'>
            <div className='footer-wrapper'>
                <div className='footer-line' />

                <div className='footer-info'>
                    <div className='footer-logo-wrapper'>
                        <Image
                            src={Logo}
                            alt="southuub"
                            height={22}
                            className='footer-logo'
                            unoptimized
                        />
                    </div>

                    <div className='footer-contacts footer-contacts-first'>
                        <p className={`${FONT_MONT_BOOK.className} footer-contacts-label`}>Контакты:</p>
                        <div className='footer-contacts-items'>
                            <span className={`${FONT_MONT_BOOK.className} footer-contacts-label`}>Email:</span>
                            <a href='mailto:mail@southhub.ru' target='_blank' className={`${FONT_MONT_BOOK.className} footer-contacts-link`}>mail@southhub.ru</a>
                        </div>
                        <div className='footer-contacts-items'>
                            <span className={`${FONT_MONT_BOOK.className} footer-contacts-label`}>Telegram:</span>
                            <a href={getLinkWithUtm(SOUTHHUB_TELEGRAM)} target='_blank' className={`${FONT_MONT_BOOK.className} footer-contacts-link`}>+7 862 29 59 977</a>
                        </div>
                    </div>

                    <div className='footer-contacts footer-contacts-second'>
                        <p className={`${FONT_MONT_BOOK.className} footer-contacts-label`}>ООО «Высокие люди»</p>
                        <p className={`${FONT_MONT_BOOK.className} footer-contacts-label`}>ИНН 2320134913</p>
                        {/* <p className={`${FONT_MONT_BOOK.className} footer-contacts-label footer-contacts-label-dashed`}>Публичная оферта</p> */}
                        <a href={getLinkWithUtm(SOUTHHUB_CONFIDENTIAL_LINK)} target='_blank' className={`${FONT_MONT_BOOK.className} footer-contacts-label footer-contacts-label-dashed`}>Политика конфиденциальности</a>
                        <a href={getLinkWithUtm(SOUTHHUB_COOKIES_LINK)} target='_blank' className={`${FONT_MONT_BOOK.className} footer-contacts-label footer-contacts-label-dashed`}>Политика обработки файлов cookie</a>
                        <a href={getLinkWithUtm(SOUTHHUB_PD_LINK)} target='_blank' className={`${FONT_MONT_BOOK.className} footer-contacts-label footer-contacts-label-dashed`}>Политика обработки персональных данных</a>
                        {/* <p className={`${FONT_MONT_BOOK.className} footer-contacts-label footer-contacts-label-dashed`}>Пользовательское соглашение</p> */}
                        <p className={`${FONT_MONT_BOOK.className} footer-contacts-label`}>© 2022-2026 South HUB. Все права защищены</p>
                    </div>

                    <div className='footer-icons'>
                        <a href={getLinkWithUtm(SOUTHHUB_YOUTUBE)} target='_blank'>
                            <Image
                                src={Youtube}
                                alt="youtube"
                                height={24}
                                unoptimized
                            />
                        </a>
                        <a href={getLinkWithUtm(SOUTHHUB_LINKEDIN)} target='_blank'>
                            <Image
                                src={LinkedIn}
                                alt="linkedin"
                                height={24}
                                unoptimized
                            />
                        </a>
                        <a href={getLinkWithUtm(TELEGRAM_CHANELL_LINK)} target='_blank' className={`${FONT_MONT_BOOK.className} footer-contacts-link`}>
                            <Image
                                src={Telegram}
                                alt="telegramm"
                                height={24}
                                unoptimized
                            />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
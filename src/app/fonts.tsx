import localFont from 'next/font/local';

// WOFF2 в 2–2,5 раза легче исходных OTF/TTF (scripts/fonts-to-woff2.mjs).
// display: swap — текст виден сразу системным шрифтом, пока грузится фирменный.
export const FONT_MONT_BOOK = localFont({ src: '../../public/Mont/Mont-Book.woff2', display: 'swap' });
// Используется только в блоке «Мы в цифрах» внизу страницы, поэтому не предзагружаем.
export const FONT_MONT_BOOK_EXTRA_LIGHT = localFont({ src: '../../public/Mont/Mont-ExtraLight.woff2', display: 'swap', preload: false });
export const FONT_IBM_PLEX_SERIF_ITALIC = localFont({ src: '../../public/IBM/IBM_Plex_Serif/IBMPlexSerif-Italic.woff2', display: 'swap' });
export const FONT_IBM_PLEX_SERIF_LIGHT = localFont({ src: '../../public/IBM/IBM_Plex_Serif/IBMPlexSerif-Light.woff2', display: 'swap' });

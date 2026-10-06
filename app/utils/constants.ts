export const NBSP = ' ';

// Событие начала ухода прелоадера: первый экран в этот момент показывает контент
export const PRELOADER_HIDE_EVENT = 'preloader:hide';

// Классы фирменных шрифтов (assets/css/fonts.css), бывшие next/font
export const FONT_MONT_BOOK = 'font-mont-book';
export const FONT_MONT_BOOK_EXTRA_LIGHT = 'font-mont-extra-light';
export const FONT_IBM_PLEX_SERIF_ITALIC = 'font-ibm-serif-italic';
export const FONT_IBM_PLEX_SERIF_LIGHT = 'font-ibm-serif-light';

declare global {
    interface Window {
        __preloaderHidden?: boolean;
    }
}

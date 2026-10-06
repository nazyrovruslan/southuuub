export const NBSP = '\u00A0';

export const LK_REGISTER_LINK = process.env.NEXT_PUBLIC_LK_REGISTER_LINK;
export const LK_LOGIN_LINK = process.env.NEXT_PUBLIC_LK_LOGIN_LINK;
export const TELEGRAM_CHANELL_LINK = process.env.NEXT_PUBLIC_TELEGRAM_CHANELL_LINK;
export const TELEGRAM_CONTACT_US_LINK = process.env.NEXT_PUBLIC_TELEGRAM_CONTACT_US_LINK;
export const MEDIAN_LINK = process.env.NEXT_PUBLIC_MEDIAN_LINK;
export const LK_SOUTHHUB_LINK = process.env.NEXT_PUBLIC_SOUTHHUB_LINK;
export const SOUTHHUB_CONFIDENTIAL_LINK = process.env.NEXT_PUBLIC_SOUTHHUB_CONFIDENTIAL_LINK;
export const SOUTHHUB_COOKIES_LINK = process.env.NEXT_PUBLIC_SOUTHHUB_COOKIES_LINK;
export const SOUTHHUB_PD_LINK = process.env.NEXT_PUBLIC_SOUTHHUB_PD_LINK;
export const SOUTHHUB_TELEGRAM = process.env.NEXT_PUBLIC_SOUTHHUB_TELEGRAM;
export const SOUTHHUB_YOUTUBE = process.env.NEXT_PUBLIC_SOUTHHUB_YOUTUBE;
export const SOUTHHUB_LINKEDIN = process.env.NEXT_PUBLIC_SOUTHHUB_LINKEDIN;
export const SNOWBASE_LINK = process.env.NEXT_PUBLIC_SNOWBASE;
export const SOUTHHUB_LINK = process.env.NEXT_PUBLIC_SOUTHHUB;
export const YOUTUBE_PLAYLIST_LINK = process.env.NEXT_PUBLIC_YOUTUBE_PLAYLIST;
// NEXT_PUBLIC_, чтобы значение попало и в браузер: счётчик ставится на клиенте.
// Со старым ENABLE_METRIC сервер рисовал счётчик, а браузер нет, и React ругался на разметку.
export const ENABLE_METRIC = process.env.NEXT_PUBLIC_ENABLE_METRIC;

export const SHSITES_URL = process.env.NEXT_PUBLIC_SHSITES_URL;
export const SHSITES_API_KEY = process.env.NEXT_PUBLIC_SHSITES_API_KEY;

// Событие начала ухода прелоадера: первый экран в этот момент показывает контент
export const PRELOADER_HIDE_EVENT = 'preloader:hide';

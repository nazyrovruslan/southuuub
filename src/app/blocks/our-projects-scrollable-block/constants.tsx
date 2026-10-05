import { LK_SOUTHHUB_LINK, NBSP, SNOWBASE_LINK, SOUTHHUB_LINK, SOUTHHUB_YOUTUBE, TELEGRAM_CHANELL_LINK, YOUTUBE_PLAYLIST_LINK } from '@/app/constants';

import ClubMeet from '../../../../public/v2/projects/встречи.webp'
import YoutubeChanell from '../../../../public/v2/projects/ютуб.webp'
import TelegramChanell from '../../../../public/v2/projects/тг.webp'
import OnlineBroadcast from '../../../../public/v2/projects/эфир.webp'
import { StaticImageData } from 'next/image';

type ArchItem = {
  id: string;
  videoId?: string;
  title: string;
  description: string;
  linkColor: string;
  imageSrc?: string | StaticImageData;
  videoSrc?: string;
  altSrc?: string | StaticImageData;
  imageAlt: string;
  buttonTitle: string;
  onClick: () => void;
}

export const getOurProjectItems = (getLinkWIthUtm: (i: string | undefined) => string): ArchItem[] => [
    {
        id: 'our-projects-south-hub',
        videoId: 'south-hub-video',
        title: 'South HUB Camp',
        description: `10–14 июня 2026 года. Сочи ежегодный кэмп-конференция для C-level в${NBSP}ІТ`,
        linkColor: '#D5FF37',
        videoSrc: '/v2/SH25.mp4',
        imageAlt: 'South HUB Camp',
        buttonTitle: 'Участвовать',
        onClick: () => window.open(getLinkWIthUtm(SOUTHHUB_LINK), '_blank'),
    },
    {
        id: 'our-projects-snow-base',
        videoId: 'snow-base-video',
        title: 'Snow BASE Camp',
        description: `19–22 марта 2026 года. Красная Поляна зимний кэмп для экспертов на стыке AI и${NBSP}бизнеса`,
        linkColor: '#D5FF37',
        videoSrc: '/v2/SB25.mp4',
        imageAlt: 'SnowBase camp',
        buttonTitle: 'Участвовать',
        onClick: () => window.open(getLinkWIthUtm(SNOWBASE_LINK), '_blank'),
    },
    {
        id: 'our-projects-club-meet',
        title: 'Клубные встречи',
        description: `Камерные события, где вы сами задаёте формат: пробежки, воркшопы, дискуссии. Здесь начинаются новые идеи и${NBSP}партнёрства`,
        linkColor: '#D5FF37',
        imageSrc: ClubMeet,
        altSrc: ClubMeet,
        imageAlt: 'club meet',
        buttonTitle: 'Участвовать',
        onClick: () => window.open(getLinkWIthUtm(LK_SOUTHHUB_LINK), '_blank'),
    },
    {
        id: 'our-projects-youtube-chanell',
        title: 'YouTube-канал',
        description: `Все записи встреч и${NBSP}вдохновляющие речи лидеров индустрии`,
        linkColor: '#D5FF37',
        imageSrc: YoutubeChanell,
        altSrc: YoutubeChanell,
        imageAlt: 'youtube chanell',
        buttonTitle: 'СМОТРЕТЬ',
        onClick: () => window.open(getLinkWIthUtm(SOUTHHUB_YOUTUBE), '_blank'),
    },
    {
        id: 'our-projects-telegramm-chanell',
        title: 'Telegram-канал',
        description: `Медиа, чтобы держать руку на пульсе cообщества, быть в${NBSP}курсе новых событий и${NBSP}находить поводы для живого диалога`,
        linkColor: '#D5FF37',
        imageSrc: TelegramChanell,
        altSrc: TelegramChanell,
        imageAlt: 'telegramm chanell',
        buttonTitle: 'Подписаться',
        onClick: () => window.open(getLinkWIthUtm(TELEGRAM_CHANELL_LINK), '_blank'),
    },
    {
        id: 'our-projects-online-broadcast',
        title: 'Онлайн-эфиры',
        description: `Каждый раз новый формат: мок-интервью, дискуссии на злободневные темы и${NBSP}живые обсуждения с${NBSP}лидерами рынка`,
        linkColor: '#D5FF37',
        imageSrc: OnlineBroadcast,
        altSrc: OnlineBroadcast,
        imageAlt: 'online broadcast',
        buttonTitle: 'смотреть',
        onClick: () => window.open(getLinkWIthUtm(YOUTUBE_PLAYLIST_LINK), '_blank'),
    },
];

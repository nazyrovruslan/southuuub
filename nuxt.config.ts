// Ссылки по умолчанию совпадают с продом; переопределяются переменными окружения
// NEXT_PUBLIC_* (как в Next-версии, .env.production менять не нужно) или NUXT_PUBLIC_* при запуске.
// пустое значение тоже означает «по умолчанию»
const env = (name: string, fallback = '') => process.env[`NEXT_PUBLIC_${name}`] || fallback;

const description = 'South HUB – пространство, где участники получают доступ к коллективному разуму C-level в IT и становятся его частью. Мы создаём безопасную среду для свободного высказывания и обмена опытом. Участники сообщества — IT-лидеры, которые делают бизнес в России и мыслят масштабно. Попадите в круг равных, где доверие и открытость вдохновляют создавать новое вместе.';

export default defineNuxtConfig({
  compatibilityDate: '2025-09-01',
  devtools: { enabled: false },

  // Компоненты из подпапок вызываются по имени файла: <AntButton>, <MainBanner>
  components: [{ path: '~/components', pathPrefix: false }],

  // Порядок как в собранной Next-версии: от него зависит, какие правила перебивают другие
  css: [
    '~/assets/css/antd-lite.css',
    '~/assets/css/tailwind-base.css',
    '~/assets/css/globals.css',
    '~/assets/css/wide-screen.css',
    '~/assets/css/blocks/preloader.css',
    '~/assets/css/fonts.css',
    '~/assets/css/blocks/accordions-block.css',
    '~/assets/css/blocks/our-projects-scrollable-block.css',
    '~/assets/css/blocks/footer.css',
    '~/assets/css/blocks/header.css',
    '~/assets/css/blocks/infinity-banner.css',
    '~/assets/css/blocks/main-banner.css',
    '~/assets/css/blocks/community-in-numbers.css',
    '~/assets/css/blocks/about-us-block.css',
    '~/assets/css/blocks/how-become-community-block.css',
    '~/assets/css/blocks/society-photos-block.css',
    '~/assets/css/blocks/block-with-u-animate.css',
    '~/assets/css/blocks/more-new.css',
  ],

  app: {
    head: {
      htmlAttrs: { lang: 'ru' },
      bodyAttrs: { class: 'antialiased' },
      title: 'Southuuub',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: description },
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: 'В сообществе C-level в IT South HUB рождаются партнёрства, дружба и смыслы, которых не найти онлайн.' },
        { property: 'og:description', content: description },
        { property: 'og:site_name', content: 'Southuuub' },
        { property: 'og:image', content: '/site.png' },
      ],
      link: [{ rel: 'icon', href: 'favicon.ico' }],
    },
  },

  runtimeConfig: {
    // только на сервере: ключ не попадает в браузер
    shsitesApiKey: env('SHSITES_API_KEY'),
    public: {
      siteDescription: description,
      lkRegisterLink: env('LK_REGISTER_LINK', 'https://lk.southhub.ru/accounts/register/'),
      lkLoginLink: env('LK_LOGIN_LINK', 'https://lk.southhub.ru/accounts/login/'),
      lkProfileLink: env('LK_PROFILE_LINK', 'https://lk.southhub.ru/profile/my/'),
      telegramChanellLink: env('TELEGRAM_CHANELL_LINK', 'https://t.me/+A-vMV8yq_6M3ZjFi'),
      telegramContactUsLink: env('TELEGRAM_CONTACT_US_LINK', 'https://t.me/+F8Vk0GiQ_Mk1MDgy'),
      medianLink: env('MEDIAN_LINK'),
      lkSouthhubLink: env('SOUTHHUB_LINK', 'https://lk.southhub.ru/events/club/'),
      southhubConfidentialLink: env('SOUTHHUB_CONFIDENTIAL_LINK', 'https://lk.southhub.ru/confidential'),
      southhubCookiesLink: env('SOUTHHUB_COOKIES_LINK', 'https://lk.southhub.ru/cookies'),
      southhubPdLink: env('SOUTHHUB_PD_LINK', 'https://lk.southhub.ru/pd'),
      southhubTelegram: env('SOUTHHUB_TELEGRAM', 'https://t.me/southhub_com'),
      southhubYoutube: env('SOUTHHUB_YOUTUBE', 'https://www.youtube.com/@sthhb'),
      southhubLinkedin: env('SOUTHHUB_LINKEDIN', 'https://www.linkedin.com/company/south-hub/'),
      snowbaseLink: env('SNOWBASE', 'https://southhub.ru/snowbase/'),
      southhubLink: env('SOUTHHUB', 'https://southhub.ru/southub/'),
      youtubePlaylistLink: env('YOUTUBE_PLAYLIST', 'https://www.youtube.com/playlist?list=PL1GqRF3TOpZAHPTOiNLLXByfEwVjHvvLO'),
      enableMetric: process.env.ENABLE_METRIC ?? '',
      shsitesUrl: env('SHSITES_URL'),
    },
  },

  nitro: {
    routeRules: {
      // базовые заголовки безопасности; HSTS ставится на nginx вместе с HTTPS
      '/**': {
        headers: {
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'SAMEORIGIN',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
          'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
        },
      },
      '/v2/**': {
        headers: {
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      },
    },
  },
});

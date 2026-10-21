// Анонс South HUB 2027. Статическая сборка: `npm run generate`.
// Для GitHub Pages базовый путь задаётся переменной NUXT_APP_BASE_URL (например /southuuub/sh2027/).
// абсолютный адрес обложки для превью ссылок (Telegram и соцсети не понимают относительные пути)
const OG_IMAGE = (process.env.OG_BASE_URL || 'https://nazyrovruslan.github.io/southuuub/sh2027/') + 'og.jpg';

export default defineNuxtConfig({
  compatibilityDate: '2025-09-01',
  devtools: { enabled: false },

  components: [{ path: '~/components', pathPrefix: false }],

  css: ['~/assets/css/fonts.css', '~/assets/css/main.css'],

  // без отдельного _payload.json: данные страницы лежат прямо в index.html (нужно для сборки `npm run static`)
  experimental: { payloadExtraction: false },

  app: {
    head: {
      htmlAttrs: { lang: 'ru' },
      title: 'South HUB 2027 — кэмп для C-level в технологиях',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'description', content: 'South HUB 2027 — кэмп для C-level в технологиях. 9–13 июня 2027. Масштаб идей, людей и тёплых связей.' },
        { name: 'theme-color', content: '#000000' },
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: 'South HUB 2027 — кэмп для C-level в технологиях' },
        { property: 'og:description', content: '9–13 июня 2027. Масштаб идей, людей и тёплых связей.' },
        { property: 'og:image', content: OG_IMAGE },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:image', content: OG_IMAGE },
      ],
      link: [{ rel: 'icon', href: 'favicon.ico' }],
    },
  },

  runtimeConfig: {
    public: {
      ticketLink: 'https://lk.southhub.ru/',
      loginLink: 'https://lk.southhub.ru/accounts/login/',
      askLink: 'https://t.me/southhub_com',
      snowbaseLink: 'https://southhub.ru/snowbase/',
      telegramInviteLink: 'https://t.me/+Up2b6jqa30xhYzMy?utm_source=SB&utm_medium=landing&utm_campaign=invite',
      telegramChannelLink: 'https://t.me/+A-vMV8yq_6M3ZjFi',
      contactUsLink: 'https://t.me/+F8Vk0GiQ_Mk1MDgy',
      youtubeLink: 'https://www.youtube.com/@sthhb',
      linkedinLink: 'https://www.linkedin.com/company/south-hub/',
      medianLink: 'https://median.agency/',
      siteLink: 'https://southhub.ru/',
      confidentialLink: 'https://lk.southhub.ru/confidential',
      cookiesLink: 'https://lk.southhub.ru/cookies',
      pdLink: 'https://lk.southhub.ru/pd',
    },
  },
});

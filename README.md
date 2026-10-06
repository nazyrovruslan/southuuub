# SOUTHUUUB — лендинг southhub.ru на Nuxt

Ветка `nuxt-rewrite`: тот же сайт, что в `source-perf-fixes` (Next + React), переписанный на Vue 3 + Nuxt 4.
Тексты, меню, фото, вёрстка и анимации не менялись.

## Запуск

```bash
npm ci
npm run dev        # http://localhost:3000
npm run build      # сборка сервера в .output
npm start          # node .output/server/index.mjs
npm run generate   # статическая сборка в .output/public
```

Статическая сборка в подпапку (так собрано демо на GitHub Pages):

```bash
NUXT_APP_BASE_URL=/southuuub/nuxt/ npm run generate
```

## Переменные окружения

Те же, что у Next-версии: `NEXT_PUBLIC_LK_LOGIN_LINK`, `NEXT_PUBLIC_TELEGRAM_CHANELL_LINK` и остальные из `.env.production`,
плюс `ENABLE_METRIC` (Яндекс.Метрика) и `NEXT_PUBLIC_SHSITES_URL` / `NEXT_PUBLIC_SHSITES_API_KEY` (SEO).
Они читаются при сборке (`nuxt.config.ts`); без них подставляются ссылки прода.
При запуске сервера их можно переопределить через `NUXT_PUBLIC_*`, например `NUXT_PUBLIC_LK_LOGIN_LINK`.
Ключ shsites теперь используется только на сервере и в браузер не попадает.

## Что где

- `app/app.vue` — страница: порядок блоков, плашка cookies, SEO.
- `app/components/blocks/` — блоки страницы (раньше `src/app/blocks/`).
- `app/components/ui/` — общие компоненты: прелоадер, видео с ленивой загрузкой,
  замены компонентов antd (`AntButton`, `AntDrawer`, `AntCollapse`) с той же разметкой и классами.
- `app/assets/css/` — стили блоков без изменений; `antd-lite.css` — базовые стили antd для этих трёх компонентов,
  `tailwind-base.css` — preflight и утилиты Tailwind из прежней сборки, `fonts.css` — шрифты.
- `app/composables/` — UTM-метки в ссылках, прогресс загрузки видео, SEO.
- `server/` — запрос SEO-данных к shsites.
- `public/` — картинки, видео и шрифты, как раньше.

Широкие экраны: `npm run gen:wide-css` пересобирает `app/assets/css/wide-screen.css` из стилей блоков.

## Что ушло вместе с React

antd, react-alice-carousel, react-awesome-reveal, @react-input/mask, react-yandex-metrika, next/image, next/font, Tailwind.
Остались gsap и сам Nuxt. Форма заявки (модальное окно и боковая панель) не открывалась ни из одного места
страницы, поэтому не переносилась.

# South HUB 2027 — анонс

Одностраничный сайт-анонс по макету Figma «South HUB App», страница «Анонс SH 2027»
(десктоп 1920, мобильная версия 390 и мобильное меню). Стек: Vue 3 + Nuxt 4, без других зависимостей.

```bash
npm install
npm run dev        # http://localhost:3000
npm run generate   # статика в .output/public
```

Для публикации не в корне домена базовый путь задаётся переменной:
`NUXT_APP_BASE_URL=/southuuub/sh2027/ npm run generate`.

## Что где
- `app/components/AppHero.vue` — первый экран, шапка и мобильное меню.
- `app/components/PatternBlock.vue` — чёрный блок с буквами U (волна под курсором и пальцем, как на southhub.ru).
- `app/components/AppFooter.vue` — median.agency и подвал.
- Ссылки — `runtimeConfig.public` в `nuxt.config.ts`.

## Что осталось от макета
- Фон героя в Figma — видео. Выгрузить его через API Figma нельзя, поэтому сейчас стоит кадр из него
  (`public/img/hero.*`). Когда будет файл, положить его в `public/video/hero.mp4` и прописать в `HERO_VIDEO` в `AppHero.vue`.
- Ссылка карточки «Как прошёл South HUB'2026» в макете не задана, сейчас ведёт на YouTube-канал.

## Статическая сборка (без Nuxt на сервере)

Готовая сборка лежит в папке `static/` ветки `sh2027-static`: `index.html` (стили встроены в страницу), JS в `_nuxt/`, картинки, иконки и видео рядом. Все пути относительные, папку можно положить в корень домена или в любую подпапку, раздавать как обычную статику (nginx и т. п.). Открывать через веб-сервер, а не двойным кликом по файлу: из `file://` браузер не запустит JS.

Пересобрать: `npm ci && npm run static`.

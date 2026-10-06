# SOUTHUUUB — лендинг southhub.ru на Nuxt

Ветка `nuxt-rewrite`: тот же сайт, что в `source-perf-fixes` (Next + React), переписанный на Vue 3 + Nuxt 4.
Тексты, меню, фото, вёрстка и анимации не менялись.

## Запуск в Docker (рекомендуется)

Нужен Docker с Compose v2.24 или новее (`docker compose version`).

### Прод

```bash
git clone -b nuxt-rewrite https://github.com/nazyrovruslan/southuuub.git
cd southuuub
cp .env.example .env.production   # необязательно: без файла будут ссылки прода
docker compose -f docker-compose.prod.yml up -d --build
```

Сайт откроется на http://localhost:3000 (порт меняется в `docker-compose.prod.yml`, строка `"3000:3000"`).

Полезные команды:

```bash
docker compose -f docker-compose.prod.yml ps        # статус и healthcheck
docker compose -f docker-compose.prod.yml logs -f   # логи
docker compose -f docker-compose.prod.yml down      # остановить
git pull && docker compose -f docker-compose.prod.yml up -d --build   # обновить
```

Контейнер собирается в три шага (зависимости, `nuxt build`, запуск). В итоговом образе только `.output`,
без исходников и `node_modules`. Процесс работает от непривилегированного пользователя, файловая система
только для чтения, лимит памяти 700 МБ.

### Разработка в Docker

```bash
docker compose up --build
```

http://localhost:3000, правки в `app/` применяются без перезапуска.

## Запуск без Docker

Нужен Node.js 22.

```bash
npm ci
npm run dev        # разработка, http://localhost:3000
npm run build      # сборка сервера в .output
npm start          # запуск собранного сервера (node .output/server/index.mjs)
npm run generate   # статическая сборка в .output/public
```

Статическая сборка в подпапку (так собрано демо на GitHub Pages):

```bash
NUXT_APP_BASE_URL=/southuuub/nuxt/ npm run generate
```

## Переменные окружения

Все необязательные: без них подставляются ссылки прода. Пример со всеми именами — `.env.example`.

- **При сборке** читаются `NEXT_PUBLIC_*` (те же имена, что у Next-версии, так что старый `.env.production` подходит как есть),
  `ENABLE_METRIC` (любое непустое значение включает Яндекс.Метрику) и `NEXT_PUBLIC_SHSITES_URL` / `NEXT_PUBLIC_SHSITES_API_KEY` (SEO).
  В Docker их берёт из `.env.production` шаг сборки, поэтому после правки файла нужен `up -d --build`.
- **При запуске** любую ссылку можно переопределить без пересборки переменной `NUXT_PUBLIC_<ИМЯ>`, например
  `NUXT_PUBLIC_LK_LOGIN_LINK`, `NUXT_PUBLIC_TELEGRAM_CHANELL_LINK`, `NUXT_PUBLIC_ENABLE_METRIC`. Их можно дописать в тот же `.env.production`:
  docker-compose.prod.yml передаёт его в контейнер. Имя строится из ключа `runtimeConfig.public` в `nuxt.config.ts`:
  `youtubePlaylistLink` → `NUXT_PUBLIC_YOUTUBE_PLAYLIST_LINK`.
- Ключ shsites используется только на сервере и в браузер не попадает.

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

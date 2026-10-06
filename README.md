# southhub.ru

Лендинг сообщества South HUB на Next.js 16 (React 18).

## Что нужно

- Docker 24+ с Docker Compose v2.24+ (команда `docker compose`), или
- Node.js 20.9+ и npm 10+ для запуска без Docker.

## Переменные окружения

Ссылки на сайте, SEO-сервис и Яндекс.Метрика задаются переменными окружения.
Образец со всеми переменными и рабочими ссылками лежит в `.env.example`:

```bash
cp .env.example .env.production
```

Переменные `NEXT_PUBLIC_*` вшиваются в сборку. После их изменения сайт нужно пересобрать
(`--build` в командах ниже). Без `.env.production` сборка проходит, но ссылки на сайте будут пустыми.

| Переменная | Зачем |
|---|---|
| `NEXT_PUBLIC_*_LINK`, `NEXT_PUBLIC_SOUTHHUB*`, `NEXT_PUBLIC_SNOWBASE`, `NEXT_PUBLIC_YOUTUBE_PLAYLIST` | ссылки в меню, кнопках и подвале |
| `NEXT_PUBLIC_SHSITES_URL`, `NEXT_PUBLIC_SHSITES_API_KEY` | SEO-данные страницы из сервиса shsites; без них берутся заголовок и описание по умолчанию |
| `NEXT_PUBLIC_ENABLE_METRIC` | любое непустое значение включает Яндекс.Метрику (раньше называлась `ENABLE_METRIC`) |
| `PORT` | порт на хосте для Docker Compose, по умолчанию 3000 |

## Продакшен в Docker

```bash
cp .env.example .env.production   # один раз, затем поправить значения
docker compose -f docker-compose.prod.yml up -d --build
```

Сайт откроется на http://localhost:3000 (или на порту из `PORT`). Дальше на сервере
ставится прокси (nginx и т. п.) на этот порт.

Полезные команды:

```bash
docker compose -f docker-compose.prod.yml ps            # статус и healthcheck
docker compose -f docker-compose.prod.yml logs -f web   # логи
docker compose -f docker-compose.prod.yml down          # остановить
```

Обновление после `git pull`: та же команда `up -d --build`, контейнер пересоберётся и перезапустится.

Контейнер запускается без root, с корневой ФС только для чтения; писать можно только в `/tmp`
и в кэш Next (`/app/.next/cache`, tmpfs). Лимиты: 700 МБ памяти, 1 CPU.

## Разработка

В Docker, с подхватом правок на лету:

```bash
docker compose up --build
```

Без Docker:

```bash
npm ci
cp .env.example .env.development   # по желанию
npm run dev
```

Сайт на http://localhost:3000.

## Сборка без Docker

```bash
npm ci
npm run build
npm start
```

## Прочее

- `npm run gen:wide-css` пересобирает `src/app/wide-screen.css` (масштабирование вёрстки на экранах шире 1920px)
  из `scripts/gen-wide-screen-css.mjs`. Сам CSS-файл лежит в репозитории, запускать перед сборкой не нужно.
- Видео первого экрана: `public/v2/southuuub-*-a.mp4` и `-b.mp4` (H.264, версии для телефона, 720p и 1080p).

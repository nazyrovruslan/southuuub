# Сборка и запуск сайта southhub.ru (Next.js).
# Цели: dev — режим разработки (docker-compose.yml), runner — продакшен (docker-compose.prod.yml).

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1


# Зависимости (кэшируются, пока не меняется package-lock.json)
FROM base AS deps
COPY package.json package-lock.json .npmrc ./
RUN npm ci


# Режим разработки: исходники монтируются томом, страница обновляется при правках
FROM base AS dev
ENV NODE_ENV=development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["npx", "next", "dev", "--hostname", "0.0.0.0", "--port", "3000"]


# Продакшен-сборка. Переменные NEXT_PUBLIC_* вшиваются в сборку,
# поэтому .env.production должен лежать в корне проекта до docker compose build.
# Если файла нет, сборка всё равно пройдёт, но ссылки на сайте будут пустыми.
FROM base AS builder
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build


# Продакшен-запуск: только нужные для работы файлы и зависимости без dev
FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NODE_OPTIONS="--max-old-space-size=512"

# Фиксированный uid: с ним совпадает tmpfs для кэша в docker-compose.prod.yml
RUN addgroup -S -g 1001 nextjs && adduser -S -u 1001 -G nextjs nextjs

COPY package.json package-lock.json .npmrc ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
# next.config.mjs нужен и при запуске: размеры картинок для широких экранов и заголовки кэша видео
COPY --from=builder /app/next.config.mjs ./next.config.mjs

RUN mkdir -p .next/cache && chown -R nextjs:nextjs .next/cache

USER nextjs
EXPOSE 3000

# next напрямую, без npm: npm пишет логи в домашнюю папку, а она в контейнере только для чтения
CMD ["node_modules/.bin/next", "start"]

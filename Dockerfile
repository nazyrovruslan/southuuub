# Stage 1: зависимости
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package*.json ./

# postinstall (nuxt prepare) требует исходников, поэтому ставим без скриптов
RUN npm ci --ignore-scripts


# Режим разработки: docker compose up (docker-compose.yml)
FROM node:22-alpine AS dev
RUN apk add --no-cache libc6-compat
WORKDIR /app

ENV NODE_ENV=development
ENV HOST=0.0.0.0
ENV PORT=3000

COPY --from=deps /app/node_modules ./node_modules
COPY . .

EXPOSE 3000
CMD ["npx", "nuxt", "dev", "--host", "0.0.0.0", "--port", "3000"]


# Stage 2: сборка
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Ссылки (NEXT_PUBLIC_*) читаются при сборке из .env.production, если файл есть;
# без него подставляются ссылки прода из nuxt.config.ts
RUN if [ -f .env.production ]; then set -a; . ./.env.production; set +a; fi && npm run build


# Stage 3: запуск
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Ограничение памяти Node.js
ENV NODE_OPTIONS="--max-old-space-size=512"

# Создаём non-root пользователя
RUN addgroup -S nuxt && adduser -S nuxt -G nuxt

# .output самодостаточен: node_modules не нужны
COPY --from=builder --chown=nuxt:nuxt /app/.output ./.output

USER nuxt

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]

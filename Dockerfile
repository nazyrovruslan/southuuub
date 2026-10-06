# Stage 1: dependencies
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package*.json ./

# Устанавливаем зависимости (postinstall nuxt prepare нужен исходник, поэтому без скриптов)
RUN npm ci --ignore-scripts


# Stage 2: build
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# production env (NEXT_PUBLIC_* читаются при сборке, см. nuxt.config.ts)
COPY .env.production .env.production

# Сборка Nuxt: всё нужное для запуска оказывается в .output
RUN set -a && . ./.env.production && set +a && npm run build


# Stage 3: production runner
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Ограничение памяти Node.js
ENV NODE_OPTIONS="--max-old-space-size=512"

# Создаём non-root пользователя
RUN addgroup -S nuxt && adduser -S nuxt -G nuxt

# .output самодостаточен: node_modules не нужны
COPY --from=builder --chown=nuxt:nuxt /app/.output ./.output

USER nuxt

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]

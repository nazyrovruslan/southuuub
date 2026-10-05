# Stage 1: dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci


# Stage 2: build
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# production env
COPY .env.production .env.production

# Сборка Next.js
RUN npm run build


# Stage 3: production runner
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Ограничение памяти Node.js
ENV NODE_OPTIONS="--max-old-space-size=512"

# Создаём non-root пользователя
RUN addgroup -S nextjs && adduser -S nextjs -G nextjs

# Создаём cache директории заранее
RUN mkdir -p /app/.next/cache && chown -R nextjs:nextjs /app

# Копируем только production-артефакты
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json

# Только production dependencies
COPY --from=deps /app/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Права
RUN chown -R nextjs:nextjs /app

USER nextjs

EXPOSE 3000

CMD ["npm", "start"]
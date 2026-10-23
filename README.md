# South HUB 2027 — анонс

Одностраничный сайт-анонс по макету Figma «South HUB App», страница «Анонс SH 2027»
(десктоп 1920, мобильная версия 390 и мобильное меню).

Стек: **Vue 3 (Composition API, `<script setup>`) + Vite + TypeScript + vite-ssg** (Static Site Generation).
Без Nuxt и vue-router; Node.js нужен только для разработки и сборки. Сборка соответствует контракту
DSFC/1 (Django Static Frontend Contract) и встраивается в Django/Wagtail как обычный шаблон, см. [DJANGO.md](DJANGO.md).

```bash
npm install
npm run dev          # http://localhost:5173/__DSFC_BASE__/
npm run typecheck    # vue-tsc
npm run build        # dist/: index.html с готовой разметкой, assets/, public/, dsfc-manifest.json
npm run check        # tools/dsfc_check.py + tools/dsfc_smoke.mjs (браузерная проверка гидратации)
npm run django       # django-build/: templates/sh2027/index.html + static/sh2027/
npm run preview      # http://localhost:4173/__DSFC_BASE__/ — готовая сборка без dev-сервера
```

## Что где

```text
index.html                      оболочка страницы: SEO по умолчанию (data-dsfc="seo") и маркеры <!--dsfc:*-->
dsfc.config.json                имя сборки, SEO по умолчанию и настройки, которые Django может менять (ссылки, API билетов)
src/main.ts                     ViteSSG(App, { hydration: true, useHead: false })
src/App.vue                     страница: герой → блок с буквами → виджет билетов → подвал
src/components/sections/        HeroSection (первый экран, шапка, мобильное меню, видео по скроллу), PatternSection (буквы U)
src/components/layout/          AppFooter
src/components/popups/          AboutPopup (полный текст), VideoPopup (ролик 2026) — только в браузере
src/components/widgets/         TicketWidget — тарифы из API Django, состояния loading / error / empty
src/composables/useSiteConfig   настройки из Django (#dsfc-config), применяются после монтирования
src/services/api.ts             fetch с таймаутом, CSRF для POST, ошибки без падения страницы
src/assets/                     шрифт, иконки, картинки, видео: попадают в сборку с хешем в имени
public/                         og.jpg и favicon.ico: постоянные имена
scripts/dsfc-postbuild.mjs      после vite-ssg: public/ в dist/public, экранирование {{ {% {#, манифест
scripts/prepare-django.mjs      из dist/ делает Django-шаблон + папку статики
tools/                          проверки контракта DSFC/1
```

## Правила, которые держат гидратацию

- Первый рендер одинаков при пререндере и в браузере: всё, что зависит от `window`, размера экрана, времени,
  запускается в `onMounted` (анимации, видео по скроллу, волна букв).
- Значения из Django применяются только после монтирования (`useSiteConfig`).
- Попапы рендерятся только в браузере (`Teleport` в `body` внутри `v-if="mounted"`).
- `<head>` из JS не меняется: заголовок и мета-теги ведёт Django.

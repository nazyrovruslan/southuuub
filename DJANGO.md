# Интеграция SH 2027 в Django / Wagtail

Vue отвечает только за интерфейс. Django отдаёт страницу, SEO, аналитику и настройки.
Сборка — обычные статические файлы и один шаблон; Node.js на сервере не нужен.

Проверено на Django 5.2 с `ManifestStaticFilesStorage` и `collectstatic`: шаблон рендерится, SEO из CMS
остаётся после гидратации, гидратация без расхождений, нет 404 и двойных загрузок, значения из CMS применяются.

## 1. Production build

```bash
npm ci
npm run build                    # dist/ — готовая статическая страница (SSG)
npm run check                    # необязательно: проверка контракта и гидратации в Chromium
npm run django                   # django-build/ — то, что переносится в Django
```

`npm run django` принимает параметры:

| параметр | по умолчанию | что значит |
|---|---|---|
| `--static-url` | `/static/` | `STATIC_URL` проекта (если статика на CDN — полный адрес, например `https://cdn.southhub.ru/static/`) |
| `--prefix` | `sh2027` | подпапка в статике и в шаблонах; для версий можно `sh2027/2026-10-22` |
| `--out` | `django-build` | куда положить результат |

Скрипт сверяет sha256 файлов с `dsfc-manifest.json` (сборку не правили руками), подставляет адрес статики
вместо токена `/__DSFC_BASE__/` во всех HTML/CSS/JS и собирает шаблон.

## 2. Какие файлы переносить

```text
django-build/
├── templates/sh2027/index.html   → в любую папку из TEMPLATES[...]["DIRS"] (или templates/ приложения)
├── static/sh2027/                → в STATICFILES_DIRS (или templates/static приложения), дальше collectstatic
│   ├── assets/                   JS, CSS, шрифт, картинки, видео — имена уже с хешем содержимого
│   └── public/                   og.jpg, favicon.ico — постоянные имена
└── dsfc-manifest.json            версия сборки и список настроек (в Django не нужен, для справки)
```

Больше ничего не нужно: нет `node_modules`, сервера и отдельного хостинга.

## 3. `index.html` как Django-шаблон

Сгенерированный `templates/sh2027/index.html` устроен так:

- вся разметка Vue завернута в `{% verbatim %}…{% endverbatim %}`: Django её не интерпретирует и не меняет;
- SEO вынесено в блоки со значениями по умолчанию: `title`, `meta_description`, `social_meta` (og и twitter);
- три точки вставки: `extra_head` (конец `<head>`), `body_start` (после `<body>`), `body_end` (перед `</body>`).

Самый простой вариант — отдать как есть:

```python
# views.py
from django.shortcuts import render

def sh2027(request):
    return render(request, "sh2027/index.html")
```

## 4. JS/CSS через Django Static Files

Ссылки на файлы уже вписаны в шаблон и в JS как `STATIC_URL + "sh2027/…"`, поэтому `{% static %}` не нужен.
Так сделано намеренно: JS сам подгружает видео и картинки, и если бы HTML шёл через `{% static %}` (с хешем
`ManifestStaticFilesStorage`), а JS — по исходному имени, браузер скачивал бы файлы дважды.

- Файлы в `assets/` уже содержат хеш в имени, их можно отдавать с `Cache-Control: max-age=31536000, immutable`.
- С `ManifestStaticFilesStorage` всё работает: `collectstatic` сохраняет и исходные имена, по ним и идут запросы.
- Если меняется `STATIC_URL` (CDN, другой префикс), пересоберите шаблон: `npm run django -- --static-url …`.
- **Видео отдавайте nginx'ом (или WhiteNoise/S3), не `django.views.static.serve`**: нужен заголовок Range,
  без него Safari не проигрывает и не проматывает видео, а фон первого экрана управляется скроллом.

```nginx
location /static/ {
    alias /srv/app/staticfiles/;
    location ~* ^/static/sh2027/assets/ { expires max; add_header Cache-Control "public, immutable"; }
}
```

## 5. SEO-переменные Wagtail

Страница Wagtail наследуется от шаблона сборки и переопределяет блоки. Django экранирует значения сам.

```django
{% extends "sh2027/index.html" %}
{% load wagtailcore_tags wagtailimages_tags %}

{% block title %}{{ page.seo_title|default:page.title }}{% endblock %}
{% block meta_description %}{{ page.search_description }}{% endblock %}

{% block social_meta %}
    <meta property="og:type" content="website">
    <meta property="og:title" content="{{ page.seo_title|default:page.title }}">
    <meta property="og:description" content="{{ page.search_description }}">
    {% if page.og_image %}{% image page.og_image fill-1200x630 as og %}
    <meta property="og:image" content="{{ request.scheme }}://{{ request.get_host }}{{ og.url }}">
    {% else %}{{ block.super }}{% endif %}
    <meta name="twitter:card" content="summary_large_image">
{% endblock %}

{% block extra_head %}
    {{ block.super }}
    <link rel="canonical" href="{{ page.full_url }}">
    <meta name="robots" content="{% if page.noindex %}noindex, nofollow{% else %}index, follow{% endif %}">
    {% include "analytics/head.html" %}      {# Метрика, GTM — только здесь, во фронтенде их нет #}
{% endblock %}

{% block body_start %}{% include "analytics/noscript.html" %}{% endblock %}
```

- Каждый тег встречается один раз: если блок переопределён, значение по умолчанию не выводится.
- `{{ block.super }}` в `extra_head` оставляет вывод `frontend_config` (раздел 6).
- JS не трогает `<title>` и мета-теги, поэтому то, что отдал Django, остаётся и после загрузки Vue.

## 6. Конфигурация фронтенда из Django

Настройки, которые можно менять без пересборки, описаны в `dsfc-manifest.json → config`
(ссылки на билеты, вход, Telegram, соцсети, политики, адрес API билетов). Django передаёт их словарём
`frontend_config`, шаблон превращает его в `<script id="dsfc-config" type="application/json">` через
`json_script` (безопасно: `<`, `>`, `&` экранируются).

```python
def get_context(self, request, *args, **kwargs):          # Wagtail Page
    ctx = super().get_context(request, *args, **kwargs)
    ctx["frontend_config"] = {
        "ticketLink": self.ticket_link,                    # «Купить билет»
        "ticketsApiUrl": reverse("tickets-api"),           # пусто или нет ключа — виджет билетов скрыт
        "ticketsEventId": "sh2027",
    }
    return ctx
```

- Ключи, которых нет в словаре, берутся из сборки. Значение другого типа (например число вместо строки) игнорируется.
- Значения применяются после загрузки Vue: в HTML сначала стоят значения из сборки, затем Vue меняет ссылки.
  Для поисковиков это неважно (ссылки внешние), для людей незаметно.
- Секреты сюда не передавать: всё в `frontend_config` видно в исходном коде страницы.

### API билетов

`TicketWidget` в HTML — пустая скрытая оболочка. Если `ticketsApiUrl` задан, в браузере уходит один запрос
`GET <ticketsApiUrl>?event=<ticketsEventId>` (cookie сессии, без ключей), ожидаемый ответ:

```json
{ "tickets": [
  { "id": "standard", "title": "Стандарт", "price": 150000, "currency": "RUB",
    "description": "Все дни кэмпа", "url": "https://lk.southhub.ru/…", "available": true }
] }
```

Состояния: загрузка, ошибка с кнопкой «Повторить» (таймаут 10 с), «Продажа билетов скоро откроется» для пустого
списка, тарифы. Ошибка API не влияет на остальную страницу. POST-запросы (`services/api.ts → request`) сами берут
CSRF из `<meta name="csrf-token">` или cookie `csrftoken`. Во время сборки API не вызывается.

## 7. Конфликты Django Template Engine и Vue

- В исходниках Vue нет Django-синтаксиса, в шаблоне сборки — нет Vue-синтаксиса: `{{ }}` Vue превращаются в текст ещё при пререндере.
- После пререндера `scripts/dsfc-postbuild.mjs` экранирует `{{`, `{%`, `{#` и `endverbatim` в тексте страницы
  (браузер покажет тот же текст, гидратация не ломается), а `prepare-django.mjs` дополнительно заворачивает
  всю разметку в `{% verbatim %}`. Двойная защита: даже если в текст попадёт `{{ … }}`, Django его не тронет.
- Свои теги Django ставьте только в блоках (`extra_head`, `body_start`, `body_end`, SEO-блоки).
- **Ничего не меняйте внутри `<div id="app" data-dsfc-root="">`** (ни руками, ни middleware, ни фильтрами
  вроде минификаторов HTML): это готовая разметка, к которой Vue привязывается при гидратации.
- Не используйте `django-htmlmin` и похожие middleware на этой странице: они меняют пробелы внутри разметки Vue.

## 8. Проверка гидратации после интеграции

1. Откройте страницу из Django (не `npm run dev`), DevTools → Console: не должно быть
   `Hydration completed but contains mismatches` и других ошибок.
2. Network: нет 404, каждый файл загружен один раз, видео отвечает `206 Partial Content`.
3. В консоли: `document.querySelector('[data-dsfc-root]').__vue_app__` — объект приложения (Vue смонтирован).
4. `document.title` и `<meta name="description">` — значения из Wagtail, а не из сборки.
5. Отключите JavaScript и обновите страницу: заголовок, тексты, кнопки и подвал на месте (это и видят поисковики).
6. Интерактив: подводка открывает попап с текстом, карточка — ролик, бургер на телефоне — меню, буквы U
   реагируют на курсор, фон первого экрана проматывается скроллом.

Автоматически то же самое проверяет `node tools/dsfc_smoke.mjs dist`: страница по одному адресу, файлы
по другому, свой `<title>` и свои значения `dsfc-config`, Chromium на десктопе и телефоне.

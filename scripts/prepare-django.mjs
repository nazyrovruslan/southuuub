// Готовит сборку из dist/ к подключению в Django как обычный шаблон + статика.
//
//   npm run build
//   npm run django -- [--static-url /static/] [--prefix sh2027] [--out django-build]
//
// Результат (django-build/):
//   templates/<prefix>/index.html   Django-шаблон: разметка Vue внутри {% verbatim %}, SEO и вставки — блоки
//   static/<prefix>/...             assets/ и public/ из dist, токен /__DSFC_BASE__/ заменён на <static-url><prefix>/
//   dsfc-manifest.json              манифест сборки (версия, настройки для CMS, список файлов)
//
// Папку static/<prefix> кладут в STATICFILES_DIRS (или сразу в STATIC_ROOT), templates/ — в DIRS шаблонов.
// Скрипт ничего не меняет внутри <div data-dsfc-root>, иначе сломается гидратация.
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const args = process.argv.slice(2)
const opt = (name, def) => (args.includes(`--${name}`) ? args[args.indexOf(`--${name}`) + 1] : def)
const dist = path.resolve(opt('dist', 'dist'))
const out = path.resolve(opt('out', 'django-build'))
const staticUrl = opt('static-url', '/static/').replace(/\/?$/, '/')
const prefix = opt('prefix', '').replace(/^\/|\/$/g, '')

const TOKEN = '/__DSFC_BASE__/'
const TEXT = new Set(['.html', '.js', '.mjs', '.css', '.json', '.webmanifest', '.svg', '.txt', '.xml'])
const die = (msg) => { console.error(`prepare-django: ${msg}`); process.exit(1) }

// 1. сборка цела: манифест есть, все файлы на месте и не менялись после npm run build
const manifestPath = path.join(dist, 'dsfc-manifest.json')
if (!fs.existsSync(manifestPath)) die(`нет ${manifestPath}, сначала npm run build`)
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
for (const f of manifest.files) {
  const file = path.join(dist, f.path)
  if (!fs.existsSync(file)) die(`в сборке нет ${f.path}`)
  const sha = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
  if (sha !== f.sha256) die(`${f.path} изменён после сборки (sha256 не совпадает)`)
}
const name = prefix || manifest.name
const base = `${staticUrl}${name}/`

fs.rmSync(out, { recursive: true, force: true })

// 2. статика: всё, кроме index.html, с подставленным адресом
for (const f of manifest.files) {
  if (f.path === manifest.entry) continue
  const src = path.join(dist, f.path)
  const dst = path.join(out, 'static', name, f.path)
  fs.mkdirSync(path.dirname(dst), { recursive: true })
  if (TEXT.has(path.extname(f.path))) fs.writeFileSync(dst, fs.readFileSync(src, 'utf8').replaceAll(TOKEN, base))
  else fs.copyFileSync(src, dst)
}

// 3. шаблон
let html = fs.readFileSync(path.join(dist, manifest.entry), 'utf8').replaceAll(TOKEN, base)
if (/\{[{%#]|endverbatim/.test(html)) die('в index.html есть Django-синтаксис; сборка должна пройти dsfc-postbuild.mjs')

const seoTags = []
const takeSeo = (re) => { html = html.replace(re, (m) => { seoTags.push(m.trim()); return '\u0000SEO\u0000' }) }
takeSeo(/<title\b[^>]*data-dsfc="seo"[^>]*>[\s\S]*?<\/title>/gi)
takeSeo(/<script\b[^>]*data-dsfc="seo"[^>]*>[\s\S]*?<\/script>/gi)
takeSeo(/<(?:meta|link)\b[^>]*data-dsfc="seo"[^>]*>/gi)

// теги идут подряд: соседние плейсхолдеры сливаются в один
html = html.replace(/\u0000SEO\u0000(?:\s*\u0000SEO\u0000)+/g, '\u0000SEO\u0000')
if (html.split('\u0000SEO\u0000').length > 2) die('SEO-теги с data-dsfc="seo" должны стоять подряд')

const attr = (tag, a) => tag.match(new RegExp(`${a}="([^"]*)"`))?.[1] ?? ''
const titleText = seoTags.find((t) => t.startsWith('<title'))?.replace(/<[^>]+>/g, '') ?? manifest.seo?.title ?? ''
const description = attr(seoTags.find((t) => /name="description"/.test(t)) ?? '', 'content')
const socialTags = seoTags
  .filter((t) => !t.startsWith('<title') && !/name="description"/.test(t))
  .map((t) => t.replace(' data-dsfc="seo"', ''))
  // адрес картинки для соцсетей должен быть абсолютным: достраиваем от текущего запроса
  .map((t) => t.replace(/content="(\/[^"]+\.(?:jpe?g|png|webp))"/, 'content="{% if request %}{{ request.scheme }}://{{ request.get_host }}{% endif %}$1"'))

const V = (s) => (s ? `{% verbatim %}${s}{% endverbatim %}` : '')
const parts = html.split('\u0000SEO\u0000')
let template = V(parts[0]) + [
  `<title>{% block title %}${titleText}{% endblock %}</title>`,
  `<meta name="description" content="{% block meta_description %}${description}{% endblock %}">`,
  `{% block social_meta %}\n    ${socialTags.join('\n    ')}\n    {% endblock %}`,
].join('\n    ') + parts.slice(1).map(V).join('')

const markers = {
  '<!--dsfc:head-->': '{% block extra_head %}{% if frontend_config %}{{ frontend_config|json_script:"dsfc-config" }}{% endif %}{% endblock %}',
  '<!--dsfc:body-start-->': '{% block body_start %}{% endblock %}',
  '<!--dsfc:body-end-->': '{% block body_end %}{% endblock %}',
}
for (const [marker, block] of Object.entries(markers)) {
  if (template.split(marker).length !== 2) die(`маркер ${marker} должен встречаться ровно один раз`)
  template = template.replace(marker, `{% endverbatim %}${block}{% verbatim %}`)
}
template = template.replace(/\{% verbatim %\}\{% endverbatim %\}/g, '')

const header = `{% comment %}
  ${manifest.title} · сборка ${manifest.version} · ${manifest.contract}
  Сгенерировано scripts/prepare-django.mjs, руками не править: пересоберите фронтенд.
  Блоки для переопределения: title, meta_description, social_meta, extra_head, body_start, body_end.
  Переменная frontend_config (dict) превращается в <script id="dsfc-config"> — ключи см. dsfc-manifest.json → config.
  Внутри verbatim-блоков ничего не менять: это готовая разметка Vue, она гидратируется в браузере.
{% endcomment %}`
fs.mkdirSync(path.join(out, 'templates', name), { recursive: true })
fs.writeFileSync(path.join(out, 'templates', name, 'index.html'), `${header}\n${template}`)
fs.copyFileSync(manifestPath, path.join(out, 'dsfc-manifest.json'))

console.log(`prepare-django: ${manifest.name} ${manifest.version}
  шаблон  ${path.relative(process.cwd(), path.join(out, 'templates', name, 'index.html'))}  → render(request, "${name}/index.html", {...})
  статика ${path.relative(process.cwd(), path.join(out, 'static', name))}/  → отдаётся по ${base}`)

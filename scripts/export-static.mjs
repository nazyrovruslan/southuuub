// Статическая копия сборки для обычного хостинга (демо на GitHub Pages, nginx без Django).
//
//   npm run build
//   npm run static -- --base /southuuub/sh2027/ --origin https://nazyrovruslan.github.io [--out static-build]
//
// Токен /__DSFC_BASE__/ заменяется на --base. Адреса картинки для соцсетей становятся абсолютными (--origin),
// иначе Telegram и соцсети не покажут превью. Манифест DSFC в копию не попадает.
import fs from 'node:fs'
import path from 'node:path'

const args = process.argv.slice(2)
const opt = (name, def) => (args.includes(`--${name}`) ? args[args.indexOf(`--${name}`) + 1] : def)
const dist = path.resolve(opt('dist', 'dist'))
const out = path.resolve(opt('out', 'static-build'))
const base = opt('base', '/').replace(/\/?$/, '/')
const origin = opt('origin', '').replace(/\/$/, '')

const TOKEN = '/__DSFC_BASE__/'
const TEXT = new Set(['.html', '.js', '.mjs', '.css', '.json', '.svg', '.txt', '.xml', '.webmanifest'])
if (!fs.existsSync(path.join(dist, 'index.html'))) { console.error('нет dist/index.html, сначала npm run build'); process.exit(1) }

fs.rmSync(out, { recursive: true, force: true })
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]))
for (const src of walk(dist)) {
  const rel = path.relative(dist, src)
  if (rel === 'dsfc-manifest.json') continue
  const dst = path.join(out, rel)
  fs.mkdirSync(path.dirname(dst), { recursive: true })
  if (!TEXT.has(path.extname(rel))) { fs.copyFileSync(src, dst); continue }
  let text = fs.readFileSync(src, 'utf8').replaceAll(TOKEN, base)
  if (rel === 'index.html' && origin) text = text.replace(/(property="og:image"|name="twitter:image")( content=")(\/)/g, `$1$2${origin}/`)
  fs.writeFileSync(dst, text)
}
console.log(`static: ${path.relative(process.cwd(), out)}/ по адресу ${origin}${base}`)

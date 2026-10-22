#!/usr/bin/env node
// Browser smoke test for Django Static Frontend Contract v1 (dsfc/1).
//
// Usage: node dsfc_smoke.mjs <build-dir> [--out <dir>] [--headed]
//
// Emulates what the Django importer does, without Django:
//   - files are served from /frontends/<name>/<version>/ with /__DSFC_BASE__/ replaced (Range supported)
//   - the page is served from /events/<name>/ (a different path than the files)
//   - default SEO tags (data-dsfc="seo") are dropped, CMS SEO and #dsfc-config are injected at the markers
// Then opens the page in Chromium (desktop + mobile) and checks hydration, SEO, 404s and config.
// Needs Playwright (npm i -D playwright, or a global install). Exit code 0 = passed.
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { execSync } from 'node:child_process'

const args = process.argv.slice(2)
const buildDir = path.resolve(args.find(a => !a.startsWith('--')) ?? '')
const outDir = path.resolve(args.includes('--out') ? args[args.indexOf('--out') + 1] : 'dsfc-smoke-out')
const TOKEN = '/__DSFC_BASE__/'
const TEXT = new Set(['.html', '.js', '.mjs', '.css', '.json', '.webmanifest', '.svg', '.txt', '.xml'])
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.gif': 'image/gif', '.ico': 'image/x-icon', '.mp4': 'video/mp4', '.webm': 'video/webm', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.txt': 'text/plain', '.xml': 'application/xml' }

if (!fs.existsSync(path.join(buildDir, 'dsfc-manifest.json'))) {
  console.error(`FAIL нет ${path.join(buildDir, 'dsfc-manifest.json')}; сначала пройдите dsfc_check.py`)
  process.exit(1)
}
const manifest = JSON.parse(fs.readFileSync(path.join(buildDir, 'dsfc-manifest.json'), 'utf8'))
const base = `/frontends/${manifest.name}/${manifest.version}/`
const pagePath = `/events/${manifest.name}/`
const SMOKE = { title: 'DSFC SMOKE TITLE', description: 'DSFC SMOKE DESCRIPTION' }

// Values the "editor" set in the CMS: every config key differs from its default.
const cmsConfig = {}
for (const [k, spec] of Object.entries(manifest.config ?? {})) {
  cmsConfig[k] = { url: `https://example.com/dsfc-smoke/${k}`, image: `https://example.com/dsfc-smoke/${k}.png`, text: `DSFC SMOKE ${k}`, richtext: `<b>DSFC SMOKE ${k}</b>`, bool: !spec.default, int: (Number(spec.default) || 0) + 1, date: '2030-01-01' }[spec.type]
}

function renderPage () {
  let html = fs.readFileSync(path.join(buildDir, manifest.entry), 'utf8').replaceAll(TOKEN, base)
  html = html.replace(/<title\b[^>]*data-dsfc="seo"[^>]*>[\s\S]*?<\/title>/gi, '')
    .replace(/<script\b[^>]*data-dsfc="seo"[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<(meta|link)\b[^>]*data-dsfc="seo"[^>]*>/gi, '')
  const json = JSON.stringify(cmsConfig).replace(/</g, '\\u003C').replace(/>/g, '\\u003E').replace(/&/g, '\\u0026')
  const head = `<title>${SMOKE.title}</title><meta name="description" content="${SMOKE.description}"><meta property="og:title" content="${SMOKE.title}"><link rel="canonical" href="https://example.com${pagePath}"><meta name="csrf-token" content="smoke-csrf"><script id="dsfc-config" type="application/json">${json}</script>`
  return html.replace('<!--dsfc:head-->', head)
    .replace('<!--dsfc:body-start-->', '<noscript id="dsfc-smoke-start"></noscript>')
    .replace('<!--dsfc:body-end-->', '<div id="dsfc-smoke-end" hidden></div>')
}

const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0])
  if (url === pagePath) { res.writeHead(200, { 'content-type': MIME['.html'] }); return res.end(renderPage()) }
  if (!url.startsWith(base)) { res.writeHead(404); return res.end('not found') }
  const file = path.join(buildDir, url.slice(base.length))
  if (!file.startsWith(buildDir) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); return res.end('not found') }
  const ext = path.extname(file).toLowerCase()
  let body = fs.readFileSync(file)
  if (TEXT.has(ext)) body = Buffer.from(body.toString('utf8').replaceAll(TOKEN, base))
  const headers = { 'content-type': MIME[ext] ?? 'application/octet-stream', 'accept-ranges': 'bytes' }
  const range = /bytes=(\d*)-(\d*)/.exec(req.headers.range ?? '')
  if (range) {
    const start = range[1] ? +range[1] : body.length - +range[2]
    const end = range[1] && range[2] ? Math.min(+range[2], body.length - 1) : body.length - 1
    res.writeHead(206, { ...headers, 'content-range': `bytes ${start}-${end}/${body.length}`, 'content-length': end - start + 1 })
    return res.end(body.subarray(start, end + 1))
  }
  res.writeHead(200, { ...headers, 'content-length': body.length })
  res.end(body)
})

async function loadPlaywright () {
  try { return await import('playwright') } catch {}
  const require = createRequire(import.meta.url)
  try {
    const globalRoot = execSync('npm root -g', { encoding: 'utf8' }).trim()
    return require(path.join(globalRoot, 'playwright'))
  } catch {}
  console.error('FAIL Playwright не найден: npm i -D playwright && npx playwright install chromium')
  process.exit(1)
}

const { chromium } = await loadPlaywright()
await new Promise(r => server.listen(0, '127.0.0.1', r))
const origin = `http://127.0.0.1:${server.address().port}`
fs.mkdirSync(outDir, { recursive: true })
const browser = await chromium.launch({ headless: !args.includes('--headed') })
const results = []
const fail = (vp, msg) => results.push(['FAIL', vp, msg])
const warn = (vp, msg) => results.push(['WARN', vp, msg])
const ok = (vp, msg) => results.push(['OK', vp, msg])

for (const vp of [{ name: 'desktop', width: 1440, height: 900 }, { name: 'mobile', width: 390, height: 844, isMobile: true, hasTouch: true }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: !!vp.isMobile, hasTouch: !!vp.hasTouch })
  const page = await ctx.newPage()
  // Подставные адреса из #dsfc-config не существуют. Если фронтенд ходит по такому адресу как в API
  // (fetch из onMounted), отвечаем пустым JSON, чтобы сетевая ошибка не попала в консоль
  await page.route('https://example.com/dsfc-smoke/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{}' }))
  const logs = []; const bad = []; const pageRelative = []
  page.on('console', m => { if (m.type() === 'error' || /hydrat/i.test(m.text())) logs.push(`${m.type()}: ${m.text().slice(0, 200)}`) })
  page.on('pageerror', e => logs.push(`pageerror: ${e.message.slice(0, 200)}`))
  page.on('response', r => {
    const u = r.url()
    if (r.status() >= 400) bad.push(`${r.status()} ${u.replace(origin, '')}`)
    if (u.startsWith(origin + pagePath) && u.split('?')[0] !== origin + pagePath) pageRelative.push(u.replace(origin, ''))
  })
  await page.goto(origin + pagePath, { waitUntil: 'networkidle', timeout: 60000 }).catch(e => logs.push(`goto: ${e.message}`))
  await page.waitForTimeout(1500)
  for (let i = 0; i < 6; i++) { await page.mouse.wheel(0, vp.height); await page.waitForTimeout(250) }
  await page.waitForTimeout(1500)
  const st = await page.evaluate(({ cms }) => {
    const root = document.querySelector('[data-dsfc-root]')
    const hrefs = [...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href'))
    return {
      title: document.title,
      desc: [...document.querySelectorAll('meta[name="description"]')].map(m => m.content),
      ogTitles: document.querySelectorAll('meta[property="og:title"]').length,
      mounted: !!(root && (root.__vue_app__ || root._vnode || root.children.length)),
      vue: !!(root && root.__vue_app__),
      rootLen: root ? root.innerHTML.length : 0,
      appliedUrls: Object.values(cms).filter(v => typeof v === 'string' && v.startsWith('https://example.com/dsfc-smoke/') && !v.endsWith('.png')).filter(v => hrefs.includes(v)).length,
      tail: !!document.getElementById('dsfc-smoke-end'),
      head: document.documentElement.outerHTML.slice(0, 200)
    }
  }, { cms: cmsConfig })
  await page.screenshot({ path: path.join(outDir, `${manifest.name}-${vp.name}.png`) })

  if (st.title === SMOKE.title) ok(vp.name, '<title> из CMS сохранился после гидратации')
  else fail(vp.name, `<title> перезаписан фронтендом: «${st.title}»`)
  if (st.desc.length === 1 && st.desc[0] === SMOKE.description) ok(vp.name, 'meta description из CMS сохранился, тег один')
  else fail(vp.name, `meta description: ${JSON.stringify(st.desc)}`)
  if (st.ogTitles !== 1) fail(vp.name, `og:title тегов: ${st.ogTitles}`)
  if (!st.rootLen) fail(vp.name, 'корневой элемент пуст')
  if (st.vue) ok(vp.name, 'Vue-приложение смонтировано на data-dsfc-root')
  else warn(vp.name, 'не вижу __vue_app__ на data-dsfc-root (приложение смонтировано в другой элемент или не Vue)')
  const hyd = logs.filter(l => /hydrat/i.test(l))
  if (hyd.length) fail(vp.name, `ошибки гидратации: ${hyd.join(' | ')}`)
  else ok(vp.name, 'гидратация без расхождений')
  const errs = logs.filter(l => !/hydrat/i.test(l))
  if (errs.length) fail(vp.name, `ошибки в консоли: ${errs.slice(0, 5).join(' | ')}`)
  const bad404 = bad.filter(b => !b.includes('blob:'))
  if (bad404.length) fail(vp.name, `ответы 4xx/5xx: ${bad404.slice(0, 8).join(', ')}`)
  else ok(vp.name, 'все запросы к файлам сборки успешны')
  if (pageRelative.length) fail(vp.name, `файлы запрашиваются относительно адреса страницы: ${pageRelative.slice(0, 5).join(', ')}`)
  const urlKeys = Object.values(manifest.config ?? {}).filter(s => s.type === 'url').length
  if (urlKeys && !st.appliedUrls) warn(vp.name, `ни одна из ${urlKeys} ссылок из #dsfc-config не появилась в <a href> после монтирования`)
  else if (urlKeys) ok(vp.name, `ссылки из #dsfc-config применены: ${st.appliedUrls} из ${urlKeys}`)
  if (!st.tail) fail(vp.name, 'вставка в body-end пропала')
  await ctx.close()
}
await browser.close()
server.close()

for (const [level, vp, msg] of results) console.log(`${level.padEnd(4)} [${vp}] ${msg}`)
const failed = results.some(r => r[0] === 'FAIL')
console.log(`\nИтог: ${failed ? 'НЕ ПРОШЛА' : 'прошла'} браузерную проверку dsfc/1 · скриншоты в ${outDir}`)
process.exit(failed ? 1 : 0)

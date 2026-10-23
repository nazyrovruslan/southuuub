// DSFC/1 post-build: moves public files under dist/public/, escapes Django template syntax in index.html,
// drops build leftovers and writes dist/dsfc-manifest.json (§8).
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const dist = path.resolve('dist')
const project = JSON.parse(fs.readFileSync('dsfc.config.json', 'utf8'))
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))
const dep = n => (pkg.dependencies?.[n] ?? pkg.devDependencies?.[n] ?? '?')

// Vite copies public/* to the dist root; DSFC wants them under public/ (index.html links them as /__DSFC_BASE__/public/...).
const pub = path.join(dist, 'public')
fs.mkdirSync(pub, { recursive: true })
for (const f of fs.readdirSync('public')) fs.renameSync(path.join(dist, f), path.join(pub, f))

fs.rmSync(path.join(dist, '.vite'), { recursive: true, force: true })

// §4: Vue decodes &#123;&#123; back to {{ when rendering, so escape after SSG. Entities are fine in HTML text and
// attributes (the browser decodes them, hydration sees the same text); <script>/<style> bodies are left to the checker.
const indexPath = path.join(dist, 'index.html')
const escaped = fs.readFileSync(indexPath, 'utf8').split(/(<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>|<!--[\s\S]*?-->)/i)
  .map((part, i) => i % 2 ? part : part.replace(/\{(?=[{%#])/g, '&#123;').replace(/endverbatim/g, 'endverb&#97;tim'))
  .join('')
fs.writeFileSync(indexPath, escaped)

const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)])
const files = walk(dist)
  .map(f => path.relative(dist, f).split(path.sep).join('/'))
  .filter(f => f !== 'dsfc-manifest.json')
  .sort()
  .map(p => {
    const buf = fs.readFileSync(path.join(dist, p))
    return { path: p, bytes: buf.length, sha256: crypto.createHash('sha256').update(buf).digest('hex') }
  })

const now = new Date()
const manifest = {
  contract: 'dsfc/1',
  name: project.name,
  title: project.title,
  version: process.env.DSFC_VERSION ?? now.toISOString().slice(0, 16).replace(/[-:T]/g, '').replace(/^(\d{8})(\d{4})$/, '$1.$2'),
  builtAt: now.toISOString(),
  generator: `vite ${dep('vite')} + vite-ssg ${dep('vite-ssg')} (single-page) + vue ${dep('vue')}`,
  entry: 'index.html',
  base: '/__DSFC_BASE__/',
  lang: project.lang,
  seo: project.seo,
  config: project.config,
  requires: project.requires ?? { csrf: false },
  externalOrigins: project.externalOrigins ?? [],
  files,
}
fs.writeFileSync(path.join(dist, 'dsfc-manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
console.log(`dsfc-manifest.json: ${manifest.name} ${manifest.version}, ${files.length} files`)

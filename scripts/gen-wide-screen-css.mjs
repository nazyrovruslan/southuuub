// Генерирует app/assets/css/wide-screen.css: пропорциональное масштабирование десктопной вёрстки
// на экранах шире 1920px. Размеры в px из CSS блоков переводятся в vw от базы 1920,
// поэтому на 2560 и 3840 страница выглядит так же, как на 1920, только крупнее.
// Правила внутри @media не трогаются (это мобильные и планшетные версии).
// Запуск после изменения стилей: node scripts/gen-wide-screen-css.mjs
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const BASE = 1920;
const ROOT = 'app/assets/css';
// базовые стили библиотек и шрифты не масштабируем
const SKIP = new Set(['antd-lite.css', 'tailwind-base.css', 'fonts.css'].map((f) => join(ROOT, f)));
const OUT = join(ROOT, 'wide-screen.css');
const PROPS = new Set([
  'font-size', 'line-height', 'letter-spacing',
  'width', 'min-width', 'max-width', 'height', 'min-height', 'max-height',
  'padding', 'padding-top', 'padding-bottom', 'padding-left', 'padding-right',
  'margin', 'margin-top', 'margin-bottom', 'margin-left', 'margin-right',
  'gap', 'row-gap', 'column-gap', 'top', 'bottom', 'left', 'right', 'inset',
  'border-radius', 'flex-basis', 'grid-template-columns', 'transform',
]);

const toVw = (value) =>
  value.replace(/(-?\d*\.?\d+)px/g, (m, n) => {
    const num = parseFloat(n);
    if (Math.abs(num) <= 2) return m; // тонкие рамки и линии оставляем
    return `${+(num * 100 / BASE).toFixed(4)}vw`;
  });

const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

// Разбирает тело блока на собственные объявления и вложенные блоки (CSS nesting).
function parseBlock(body) {
  const decls = [];
  const children = [];
  let depth = 0, buf = '', head = '';
  for (const ch of body) {
    if (depth === 0) {
      if (ch === '{') { head = buf.trim(); buf = ''; depth = 1; continue; }
      if (ch === ';') { decls.push(buf.trim()); buf = ''; continue; }
      buf += ch;
    } else {
      if (ch === '{') depth++;
      if (ch === '}' && --depth === 0) { children.push([head, buf]); buf = ''; continue; }
      buf += ch;
    }
  }
  if (buf.trim()) decls.push(buf.trim());
  return { decls, children };
}

const joinSelector = (parent, child) => {
  if (!parent) return child;
  const parents = parent.split(',').map((s) => s.trim());
  return child.split(',').map((c) => c.trim()).flatMap((c) =>
    parents.map((p) => (c.includes('&') ? c.replaceAll('&', p) : `${p} ${c}`)),
  ).join(', ');
};

function collect(body, parentSel, out) {
  const { decls, children } = parseBlock(body);
  if (parentSel) {
    const converted = [];
    for (const d of decls) {
      const i = d.indexOf(':');
      if (i < 0) continue;
      const prop = d.slice(0, i).trim();
      const value = d.slice(i + 1).trim();
      if (!PROPS.has(prop) || !value.includes('px')) continue;
      if (prop === 'max-width' && /1920px/.test(value)) { converted.push('max-width: none'); continue; }
      const next = toVw(value);
      if (next !== value) converted.push(`${prop}: ${next}`);
    }
    // префикс html поднимает специфичность, чтобы правило побеждало стили блоков
    // независимо от порядка подключения CSS-файлов
    const sel = parentSel.split(',').map((s) => `html ${s.trim()}`).join(', ');
    if (converted.length) out.push(`  ${sel} { ${converted.join('; ')}; }`);
  }
  for (const [head, childBody] of children) {
    if (head.startsWith('@')) continue; // @media, @keyframes, @font-face и т. п.
    collect(childBody, joinSelector(parentSel, head), out);
  }
}

const files = [];
(function walk(dir) {
  for (const name of readdirSync(dir).sort()) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.css') && p !== OUT && !SKIP.has(p)) files.push(p);
  }
})(ROOT);

const rules = [];
for (const f of files) {
  const before = rules.length;
  collect(stripComments(readFileSync(f, 'utf8')), '', rules);
  if (rules.length > before) rules.splice(before, 0, `  /* ${f} */`);
}

writeFileSync(OUT, `/* Сгенерировано scripts/gen-wide-screen-css.mjs, не редактировать вручную. */
@media (min-width: 1921px) {
${rules.join('\n')}
}
`);
console.log(`${OUT}: ${rules.length} строк из ${files.length} файлов`);

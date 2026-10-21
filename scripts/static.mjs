// Готовит папку static/ из .output/public после `NUXT_APP_BASE_URL=./ nuxt generate`.
// Запуск: node scripts/static.mjs <префикс>, где префикс — имя папки сайта внутри STATIC_ROOT Django.
//
// На выходе две версии одной страницы:
//   static/index.html        — обычная статика с относительными путями, кладётся в любую папку любого веб-сервера;
//   static/index.django.html — шаблон Django: те же пути через {% static '<префикс>/...' %}.
// Стили встроены в страницу, весь JS — один файл _nuxt/*.js без import внутри.
//
// Роутер Nuxt на клиенте склеивает адрес из baseURL, и с './' адрес в строке браузера ломается,
// поэтому baseURL вычисляется в браузере: папка, из которой открыта страница. А файлы сайта
// (картинки, видео) JS берёт из window.__ASSETS__, который задаёт сама страница.
import { cpSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

const prefix = process.argv[2] || 'site';
const OUT = 'static';
rmSync(OUT, { recursive: true, force: true });
cpSync('.output/public', OUT, { recursive: true });
// страницы ошибок со своим адресом здесь не нужны: сайт из одной страницы
rmSync(`${OUT}/200.html`, { force: true });
rmSync(`${OUT}/404.html`, { force: true });

let html = readFileSync(`${OUT}/index.html`, 'utf8');

// общий css сборки — внутрь страницы (пути в нём были относительно папки _nuxt/)
html = html.replace(/<link rel="stylesheet" href="\.\/(_nuxt\/[^"]+\.css)"[^>]*>/g, (_, file) => {
    const css = readFileSync(`${OUT}/${file}`, 'utf8').replace(/url\(\.\//g, 'url(./_nuxt/');
    rmSync(`${OUT}/${file}`);
    return `<style>${css}</style>`;
});

// css, который уже встроен в страницу самим Nuxt, отдельным файлом не нужен
for (const file of readdirSync(`${OUT}/_nuxt`)) {
    if (file.endsWith('.css') && !html.includes(file)) rmSync(`${OUT}/_nuxt/${file}`);
}

const base = 'baseURL:"./"';
if (!html.includes(base)) throw new Error(`${base} не найден в index.html — собирайте через npm run static`);
html = html.replace(base, 'baseURL:location.pathname.replace(/[^/]*$/,"")');

const assets = (value) => `<script>window.__ASSETS__=${value}</script>`;
const marker = '<script type="module"';
if (!html.includes(marker)) throw new Error('не найден <script type="module"> в index.html');

writeFileSync(`${OUT}/index.html`, html.replace(marker, assets('"./"') + marker));

const django = html
    .replace(marker, assets(`"{% static '${prefix}/' %}"`) + marker)
    .replace(/="\.\/([^"]+)"/g, (_, path) => `="{% static '${prefix}/${path}' %}"`)
    .replace(/url\(\.\/([^)]+)\)/g, (_, path) => `url({% static '${prefix}/${path}' %})`);
if (/\{\{|\{%(?! static )/.test(django.replace(/\{% load static %\}/, ''))) {
    throw new Error('в странице есть {{ или {% — Django примет их за шаблон, проверьте index.django.html');
}
writeFileSync(`${OUT}/index.django.html`, `{% load static %}\n${django}`);

console.log(`Готово: ${OUT}/index.html и ${OUT}/index.django.html (префикс '${prefix}')`);

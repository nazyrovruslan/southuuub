// Готовит папку static/ из .output/public после `NUXT_APP_BASE_URL=./ nuxt generate`.
// Все ссылки в HTML уже относительные (./_nuxt/..., ./img/...), но роутер Nuxt на клиенте
// склеивает адрес из baseURL, и с './' адрес в строке браузера ломается. Поэтому baseURL
// вычисляется в браузере: папка, из которой открыт index.html. Так сборку можно положить
// в корень домена или в любую подпапку без пересборки.
import { cpSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

const OUT = 'static';
rmSync(OUT, { recursive: true, force: true });
cpSync('.output/public', OUT, { recursive: true });
// страницы ошибок со своим адресом здесь не нужны: сайт из одной страницы
rmSync(`${OUT}/200.html`, { force: true });
rmSync(`${OUT}/404.html`, { force: true });

const file = `${OUT}/index.html`;
const html = readFileSync(file, 'utf8');
const next = html.replace('baseURL:"./"', 'baseURL:location.pathname.replace(/[^/]*$/,"")');
if (next === html) throw new Error('baseURL:"./" не найден в index.html — собирайте через npm run static');
writeFileSync(file, next);
console.log(`Готово: ${OUT}/`);

// Конвертирует TTF/OTF в WOFF2 без внешних зависимостей (brotli есть в Node).
// Таблицы сжимаются как есть (null transform), поэтому файл чуть больше, чем у
// эталонного woff2_compress, но на 45–55% меньше исходного TTF/OTF.
// Запуск: node scripts/fonts-to-woff2.mjs public/Mont/Mont-Book.otf [...]
import { readFileSync, writeFileSync } from 'node:fs';
import { brotliCompressSync, constants } from 'node:zlib';

const pad4 = (n) => (n + 3) & ~3;

function base128(n) {
  const bytes = [];
  do { bytes.unshift(n & 0x7f); n >>>= 7; } while (n > 0);
  for (let i = 0; i < bytes.length - 1; i++) bytes[i] |= 0x80;
  return bytes;
}

function toWoff2(sfnt) {
  const flavor = sfnt.readUInt32BE(0);
  const numTables = sfnt.readUInt16BE(4);
  const tables = [];
  for (let i = 0; i < numTables; i++) {
    const rec = 12 + i * 16;
    const tag = sfnt.toString('latin1', rec, rec + 4);
    const offset = sfnt.readUInt32BE(rec + 8);
    const length = sfnt.readUInt32BE(rec + 12);
    tables.push({ tag, data: sfnt.subarray(offset, offset + length) });
  }
  // glyf должен идти перед loca; сортировка по тегу это обеспечивает
  tables.sort((a, b) => (a.tag < b.tag ? -1 : a.tag > b.tag ? 1 : 0));

  const dir = [];
  for (const t of tables) {
    // 63 = произвольный тег (записывается следом); для glyf/loca версия 3 = без трансформации
    const transform = t.tag === 'glyf' || t.tag === 'loca' ? 3 : 0;
    dir.push((transform << 6) | 63, ...Buffer.from(t.tag, 'latin1'), ...base128(t.data.length));
  }
  const stream = Buffer.concat(tables.map((t) => t.data));
  const compressed = brotliCompressSync(stream, {
    params: {
      [constants.BROTLI_PARAM_MODE]: constants.BROTLI_MODE_FONT,
      [constants.BROTLI_PARAM_QUALITY]: 11,
      [constants.BROTLI_PARAM_SIZE_HINT]: stream.length,
    },
  });

  const totalSfntSize = 12 + 16 * numTables + tables.reduce((s, t) => s + pad4(t.data.length), 0);
  const length = pad4(48 + dir.length + compressed.length);
  const out = Buffer.alloc(length);
  out.write('wOF2', 0, 'latin1');
  out.writeUInt32BE(flavor, 4);
  out.writeUInt32BE(length, 8);
  out.writeUInt16BE(numTables, 12);
  out.writeUInt32BE(totalSfntSize, 16);
  out.writeUInt32BE(compressed.length, 20);
  out.writeUInt16BE(1, 24); // majorVersion
  Buffer.from(dir).copy(out, 48);
  compressed.copy(out, 48 + dir.length);
  return out;
}

for (const file of process.argv.slice(2)) {
  const src = readFileSync(file);
  const dst = file.replace(/\.(ttf|otf)$/i, '.woff2');
  const woff2 = toWoff2(src);
  writeFileSync(dst, woff2);
  console.log(`${dst}: ${(src.length / 1024).toFixed(0)} КБ -> ${(woff2.length / 1024).toFixed(0)} КБ`);
}

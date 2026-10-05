#!/usr/bin/env bash
# TTF/OTF -> WOFF2 с подмножеством латиница + кириллица.
# Нужен fonttools: pip install fonttools brotli
# Mont — коммерческий шрифт: перед конвертацией проверьте, что лицензия разрешает веб-версию и сабсет.
set -euo pipefail
IN=${1:?папка со шрифтами}; OUT=${2:-public/fonts}; mkdir -p "$OUT"
UNICODES="U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2000-206F,U+2116,U+20BD,U+2212"
for f in "$IN"/*.ttf "$IN"/*.otf; do
  [ -e "$f" ] || continue
  name=$(basename "${f%.*}")
  pyftsubset "$f" --unicodes="$UNICODES" --flavor=woff2 --layout-features='*' --output-file="$OUT/$name.woff2"
  echo "$name: $(stat -c%s "$f") -> $(stat -c%s "$OUT/$name.woff2") байт"
done

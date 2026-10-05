#!/usr/bin/env bash
# Пережатие видео для southhub.ru. Нужен ffmpeg с libx264 и libwebp.
# Запуск: ./scripts/encode-videos.sh путь/к/исходникам public/v2
set -euo pipefail
SRC=${1:?папка с исходными mp4}; OUT=${2:-public/v2}; mkdir -p "$OUT"
X264="-c:v libx264 -preset slow -profile:v high -pix_fmt yuv420p -an -movflags +faststart"

# hero, десктоп: 1920×1080, ≈2,5 Мбит/с
ffmpeg -y -i "$SRC/southuuub.mp4" $X264 -crf 25 -maxrate 3M -bufsize 6M "$OUT/southuuub.mp4"
# hero, телефон: центральный вертикальный кроп 608×1080
ffmpeg -y -i "$SRC/southuuub.mp4" -vf "crop=608:1080" $X264 -crf 25 -maxrate 1.8M -bufsize 3.6M "$OUT/southuuub-mobile.mp4"
# видео проектов
ffmpeg -y -i "$SRC/SH25.mp4" $X264 -crf 22 -maxrate 2.2M -bufsize 4.4M "$OUT/SH25.mp4"
ffmpeg -y -i "$SRC/SB25.mp4" $X264 -crf 25 -maxrate 1.8M -bufsize 3.6M "$OUT/SB25.mp4"

# постеры (первый кадр)
for f in southuuub southuuub-mobile SH25 SB25; do
  ffmpeg -y -i "$OUT/$f.mp4" -frames:v 1 -c:v libwebp -quality 72 "$OUT/$f-poster.webp"
done

// Конфиг на JS, а не на TS: next start в продакшен-образе загружает его без TypeScript
// (next.config.ts требовал TypeScript при запуске, и контейнер падал).

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: false,
  images: {
    // 2560 и 3840 — для широких мониторов, где вёрстка теперь масштабируется
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2560, 3840],
    formats: ['image/avif', 'image/webp'],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 14, // 14 дней
  },
  async headers() {
    return [
      {
        source: '/v2/:path*',
        headers: [
          {
            key: 'Accept-Ranges',
            value: 'bytes',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;

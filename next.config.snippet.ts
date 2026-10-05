// Добавить в существующий next.config.(ts|js|mjs)
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],   // сейчас отдаётся только WebP
    deviceSizes: [390, 640, 768, 1080, 1366, 1920, 2560],
    imageSizes: [64, 128, 256, 384],
    minimumCacheTTL: 31536000,
  },
  compress: true,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};
export default nextConfig;

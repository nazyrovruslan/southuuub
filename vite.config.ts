import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  // DSFC/1 §3: все локальные адреса начинаются с этого токена, Django при импорте подставляет реальный путь
  base: '/__DSFC_BASE__/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@unhead/vue/client': fileURLToPath(new URL('./src/stubs/unhead.ts', import.meta.url)),
      '@unhead/vue/server': fileURLToPath(new URL('./src/stubs/unhead.ts', import.meta.url)),
    },
  },
  build: {
    assetsDir: 'assets',
    // SVG и картинки отдельными файлами с хешем, а не data: внутри JS
    assetsInlineLimit: 0,
    sourcemap: false,
  },
  ssgOptions: {
    // без форматирования: сохраняет маркеры <!--dsfc:*--> и не меняет разметку, которую гидратирует Vue
    formatting: 'none',
  },
})

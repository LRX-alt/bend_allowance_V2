import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@views': resolve(__dirname, 'src/views'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@composables': resolve(__dirname, 'src/composables'),
      '@assets': resolve(__dirname, 'src/assets'),
    },
  },
  server: {
    port: 8080,
  },
  // Opzioni per vite-ssg (Static Site Generation)
  ssgOptions: {
    script: 'async',
    formatting: 'minify',
    // Genera solo le pagine reali; il path '/calculator' e un redirect.
    includedRoutes(paths) {
      return paths.filter(path => path !== '/calculator');
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
});

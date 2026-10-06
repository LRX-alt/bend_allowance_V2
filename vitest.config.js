import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const webSrc = fileURLToPath(new URL('./apps/web/src', import.meta.url));
const engine = fileURLToPath(new URL('./packages/bend-core/src/bendingEngine.ts', import.meta.url));
const materials = fileURLToPath(new URL('./packages/bend-core/src/materials.ts', import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      { find: '@/utils/bendingEngine.js', replacement: engine },
      { find: '@/utils/materials.js', replacement: materials },
      { find: '@', replacement: webSrc },
    ],
  },
  test: {
    environment: 'node',
    include: [
      'apps/web/src/**/*.{test,spec}.{js,mjs,ts}',
      'packages/**/__tests__/**/*.{test,spec}.{js,mjs,ts}',
    ],
    globals: true,
  },
});

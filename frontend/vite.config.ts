import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, import.meta.dirname, 'VITE_');
  let apiTarget = 'http://localhost:5000';
  try {
    const configured = new URL(env.VITE_API_URL || apiTarget);
    if (['localhost', '127.0.0.1', '[::1]'].includes(configured.hostname)) apiTarget = configured.origin;
  } catch { /* A relative VITE_API_URL uses the default local backend. */ }

  return {
  plugins: [react()],
  // Workspace packages bypass automatic dependency pre-bundling. This package
  // emits CommonJS, so convert it to browser ESM before serving named imports.
  optimizeDeps: {
    include: ['@moneymate/design-tokens'],
  },
  publicDir: path.resolve(import.meta.dirname, '../assets/images'),
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
      react: path.resolve(import.meta.dirname, './node_modules/react'),
      'react-dom': path.resolve(import.meta.dirname, './node_modules/react-dom'),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': { target: apiTarget, changeOrigin: true },
    },
  },
  test: {
    environment: 'jsdom',
    // Resolve shared React dependencies through the frontend alias in integration tests.
    server: { deps: { inline: ['@tanstack/react-query'] } },
    globals: true,
    setupFiles: './src/test/setup.ts',
    css: true,
    coverage: {
      provider: 'v8',
      // Measure executable application logic. React views are verified by the
      // render/integration suite, while their JSX callback wrappers would make
      // function coverage depend on implementation details rather than behavior.
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.stories.{ts,tsx}',
        'src/test/**',
        'src/types/**',
        'src/main.tsx',
        'src/vite-env.d.ts',
      ],
      reporter: ['text', 'json-summary', 'html'],
      thresholds: {
        statements: 90,
        branches: 90,
        functions: 90,
        lines: 90,
      },
    },
  },
  };
});

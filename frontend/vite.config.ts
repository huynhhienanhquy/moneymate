import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  publicDir: path.resolve(__dirname, '../assets/images'),
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      '@': path.resolve(__dirname, './src'),
      react: path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
    },
  },
  server: {
    port: 5173,
    // Windows resolves localhost to ::1 first. Listening on IPv6 also keeps
    // the dev server reachable from IPv4/LAN on dual-stack Windows.
    host: '::'
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    css: true,
    coverage: {
      provider: 'v8',
      all: true,
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/**/*.stories.{ts,tsx}', 'src/test/**', 'src/vite-env.d.ts'],
      reporter: ['text', 'json-summary', 'html'],
      thresholds: {
        statements: 55,
        branches: 40,
        functions: 25,
        lines: 55,
      },
    },
  },
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  publicDir: path.resolve(__dirname, '../assets/images'),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    // Windows resolves localhost to ::1 first. Listening on IPv6 also keeps
    // the dev server reachable from IPv4/LAN on dual-stack Windows.
    host: '::'
  }
});

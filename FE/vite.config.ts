import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/configuratori/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      base: '/configuratori/',
      scope: '/configuratori/',
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        cleanupOutdatedCaches: true,
        navigateFallback: '/configuratori/index.html',
        navigateFallbackAllowlist: [/^\/configuratori\//],
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  server: {
    host: '0.0.0.0',
    port: 5174,
    proxy: {
      '/api/configuratori': {
        target: 'http://192.168.1.252:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/configuratori/, '/api'),
      },
    },
  },
});

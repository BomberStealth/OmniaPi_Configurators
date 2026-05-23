import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/configuratori/',
  plugins: [react()],
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

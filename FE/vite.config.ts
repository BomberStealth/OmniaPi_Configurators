import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Timestamp univoco per ogni build — usato per rilevare versione deployata
const BUILD_TS = Date.now().toString();

const versionJsonPlugin = () => ({
  name: 'version-json',
  generateBundle() {
    (this as any).emitFile({
      type: 'asset',
      fileName: 'version.json',
      source: JSON.stringify({ v: BUILD_TS }),
    });
  },
});

export default defineConfig({
  base: '/configuratori/',
  plugins: [react(), versionJsonPlugin()],
  define: {
    __BUILD_TS__: JSON.stringify(BUILD_TS),
  },
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

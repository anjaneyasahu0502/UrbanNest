import { defineConfig } from 'vite';
import path from 'path';

const BACKEND_URL = process.env.VITE_API_URL || 'http://localhost:8080';

export default defineConfig({
  build: {
    // Output goes to dist/ — deploy this directory to a CDN / static host.
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,

    rollupOptions: {
      input: {
        index:          path.resolve(__dirname, 'index.html'),
        // Entry points: one JS bundle per "page group"
        main:           path.resolve(__dirname, 'src/main.js'),
        searchAssistant: path.resolve(__dirname, 'src/searchAssistant.js'),
      },
    },
  },

  server: {
    port: 3000,
    // Proxy every request that isn't a Vite-handled asset to the backend
    proxy: {
      // Everything except /@vite, /src, /node_modules, and known asset exts
      '^(?!/@vite|/src|/node_modules).*': {
        target: BACKEND_URL,
        changeOrigin: true,
        // Pass credentials (session cookies)
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('X-Forwarded-For', '127.0.0.1');
          });
        },
      },
    },
  },
});

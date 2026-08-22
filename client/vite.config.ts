import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  server: {
    // Honours PORT so the dev server can move when 5173 is taken. Requests
    // still reach the API through the proxy below, so the browser sees a
    // single origin and the port change needs no CORS change.
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
    // Proxying in development means the browser sees one origin, so the dev
    // setup matches the nginx production setup instead of relying on CORS.
    proxy: {
      '/api': {
        target: process.env.VITE_DEV_API_TARGET ?? 'http://localhost:4000',
        changeOrigin: true,
        configure(proxy) {
          // The browser treats these as same-origin but still sends an Origin
          // header on non-GET requests. Forwarding it would make the API see a
          // cross-origin call from whatever port Vite picked and reject it.
          // Stripping it makes the hop server-to-server, which CORS allows.
          proxy.on('proxyReq', (proxyReq) => proxyReq.removeHeader('origin'));
        },
      },
    },
  },

  build: {
    sourcemap: true,
    // Vendor code changes far less often than app code; splitting it keeps the
    // large cached chunk stable across deploys.
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          query: ['@tanstack/react-query', 'axios'],
          forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
        },
      },
    },
    chunkSizeWarningLimit: 700,
  },

  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});

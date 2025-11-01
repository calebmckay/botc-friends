import { defineConfig } from 'vite'
import { playwright } from '@vitest/browser-playwright'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    viteStaticCopy({
      targets: [
        {
          src: 'public/*',
          dest: '.',
        },
        {
          src: 'icons/*',
          dest: 'assets/icons',
        }
      ],
    }),
  ],
  build: {
    chunkSizeWarningLimit: 1600,
    outDir: 'build',
    minify: false,
    rollupOptions: {
      input: {
        main: './index.html',
        background: './src/background.js'
      },
      output: {
        entryFileNames: (chunkInfo) => {
          return chunkInfo.name === 'background' ? 'background.js' : 'assets/[name]-[hash].js';
        },
      },
    },
  },
  test: {
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [
        { browser: 'chromium' },
      ],
    },
    setupFiles: './vitest.init.js'
  },
  server: {
    host: '127.0.0.1',
    watch: {
      usePolling: true
    }
  }
});
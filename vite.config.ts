import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  root: 'src',
  publicDir: 'public',

  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        newtab: path.resolve(__dirname, 'src/newtab.html'),
        popup: path.resolve(__dirname, 'src/popup.html'),
        sidepanel: path.resolve(__dirname, 'src/sidepanel.html'),
        settings: path.resolve(__dirname, 'src/settings.html'),
        background: path.resolve(__dirname, 'src/background/index.ts'),
      },
      output: {
        entryFileNames: (chunk) =>
          chunk.name === 'background' ? 'background.js' : 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },

  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './test/setup.ts',
    include: ['**/*.{test,spec}.?(c|m)[jt]s?(x)'],
  },

  server: {
    port: 5173,
    strictPort: true,
  },
});

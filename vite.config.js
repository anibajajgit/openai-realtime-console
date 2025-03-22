
import { join, dirname, resolve } from "path";
import { fileURLToPath } from "url";
import react from "@vitejs/plugin-react";
import { defineConfig } from 'vite';

const path = fileURLToPath(import.meta.url);

export default defineConfig({
  root: join(dirname(path), "client"),
  plugins: [react()],
  build: {
    outDir: join(dirname(path), "dist/client"),
    emptyOutDir: true,
    rollupOptions: {
      external: ['motion-dom']
    }
  },
  optimizeDeps: {
    exclude: ['motion-dom']
  },
  resolve: {
    alias: {
      '@': resolve(dirname(path), 'client'),
      '@lib': resolve(dirname(path), 'client/lib')
    }
  },
  server: {
    hmr: {
      clientPort: 443,
      host: '0.0.0.0',
      protocol: 'wss'
    },
    middlewareMode: true,
    watch: {
      usePolling: false,
      ignored: ['**/node_modules/**', '**/.git/**']
    }
  }
});

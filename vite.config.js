
import { join, dirname, resolve } from "path";
import { fileURLToPath } from "url";
import react from "@vitejs/plugin-react";
import { defineConfig } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  root: resolve(__dirname, "client"),
  plugins: [react()],
  build: {
    outDir: resolve(__dirname, "dist/client"),
    emptyOutDir: true
  },
  optimizeDeps: {
    exclude: ['motion-dom']
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'client'),
      '@lib': resolve(__dirname, 'client/lib')
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

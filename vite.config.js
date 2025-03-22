
import { join, dirname, resolve } from "path";
import { fileURLToPath } from "url";
import react from "@vitejs/plugin-react";

const path = fileURLToPath(import.meta.url);

export default {
  root: join(dirname(path), "client"),
  plugins: [react()],
  build: {
    rollupOptions: {
      external: ['motion-dom']
    }
  },
  optimizeDeps: {
    exclude: ['motion-dom']
  },
  assetsInclude: ['**/*.jsx'],
  esbuild: {
    loader: { '.js': 'jsx', '.ts': 'tsx' },
    jsxInject: "import React from 'react'",
  },
  resolve: {
    alias: {
      '@': resolve(dirname(path), 'client'),
      '@lib': resolve(dirname(path), 'client/lib')
    }
  },
  server: {
    hmr: false,
    middlewareMode: true,
    watch: {
      usePolling: false,
      ignored: ['**/node_modules/**', '**/.git/**']
    }
  }
};

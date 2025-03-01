import { join, dirname, resolve } from "path";
import { fileURLToPath } from "url";
import react from "@vitejs/plugin-react";
import { defineConfig } from 'vite'; // Added import for defineConfig

const path = fileURLToPath(import.meta.url);

export default defineConfig({
  root: join(dirname(path), "client"),
  plugins: [react()],
  server: {
    hmr: {
      protocol: 'wss',
      clientPort: 443,
      port: 24678,
    },
  },
});
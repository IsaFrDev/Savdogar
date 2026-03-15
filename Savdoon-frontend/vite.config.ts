import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  css: {
    modules: {
      generateScopedName: (name, filename) => {
        if (process.env.NODE_ENV === 'production') {
          // Generate a short hash in production
          let hash = 0;
          for (let i = 0; i < (filename + name).length; i++) {
            hash = ((hash << 5) - hash) + (filename + name).charCodeAt(i);
            hash |= 0;
          }
          return 'x' + Math.abs(hash).toString(36).substring(0, 4);
        }
        // Readable names in development
        const basename = path.basename(filename).split('.')[0];
        return `${basename}_${name}`;
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    allowedHosts: true,
    host: true,
    port: 5173,
    strictPort: true,
    hmr: {
      host: '127.0.0.1',
      protocol: 'ws',
      clientPort: 5173,
    },
    watch: {
      usePolling: true,
    },
  },
});

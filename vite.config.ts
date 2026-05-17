import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'local-site-generator',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url === '/api/create-site' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', () => {
              try {
                const { storeName, storeSlug, supabaseUrl, supabaseKey } = JSON.parse(body);
                const defaultSitePath = path.resolve(__dirname, 'sites/Default Site');
                const targetPath = path.resolve(__dirname, 'sites', storeSlug);
                
                if (!fs.existsSync(targetPath)) {
                  fs.mkdirSync(targetPath, { recursive: true });
                }

                // Read files from Default Site
                const files = ['_navbar.html', 'auth.js', 'favourites.html', 'index.html', 'main.css', 'product.html', 'products.js', 'profile.html'];
                
                for (const file of files) {
                  const srcFile = path.join(defaultSitePath, file);
                  if (fs.existsSync(srcFile)) {
                    let content = fs.readFileSync(srcFile, 'utf8');
                    // Replace variables
                    content = content.replace(/{{STORE_NAME}}/g, storeName);
                    content = content.replace(/{{STORE_SLUG}}/g, storeSlug);
                    if (supabaseUrl) content = content.replace(/{{SUPABASE_URL}}/g, supabaseUrl);
                    if (supabaseKey) content = content.replace(/{{SUPABASE_KEY}}/g, supabaseKey);
                    
                    fs.writeFileSync(path.join(targetPath, file), content);
                  }
                }
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, path: targetPath }));
              } catch (err) {
                console.error(err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
              }
            });
            return;
          }
          next();
        });
      }
    }
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
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    hmr: {
      protocol: 'ws',
      clientPort: 5173,
    },
    watch: {
      usePolling: true,
    },
  },
});

import http from 'node:http';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    {
      // Proxy 6-char short code paths to backend before Vite's HTML fallback runs
      name: 'short-code-proxy',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (!req.url || !/^\/[a-zA-Z0-9]{6}$/.test(req.url)) return next();
          const proxyReq = http.request(
            {
              hostname: 'localhost',
              port: 4000,
              path: req.url,
              method: req.method,
              headers: { ...req.headers, host: 'localhost:4000' },
            },
            (proxyRes) => {
              res.writeHead(proxyRes.statusCode!, proxyRes.headers);
              proxyRes.pipe(res);
            },
          );
          proxyReq.on('error', next);
          req.pipe(proxyReq);
        });
      },
    },
  ],
  server: {
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
});

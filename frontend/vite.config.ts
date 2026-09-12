import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:4000',
      // Proxy short code redirects: single path segment that is not a known asset
      '^/[a-zA-Z0-9]{6}$': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});

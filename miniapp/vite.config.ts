import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://hotdeal-site.sxc4566.workers.dev',
        changeOrigin: true,
      },
    },
  },
});

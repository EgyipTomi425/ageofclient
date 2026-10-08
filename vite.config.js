import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/ageof/',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 18431,
    strictPort: true,
    allowedHosts: ['echter.ddns.net'],
    proxy: {
      '/age3ofserver': {
        target: 'https://127.0.0.1',
        changeOrigin: false,
        secure: false,
        headers: { host: 'echter.ddns.net' },
      },
    },
  },
});

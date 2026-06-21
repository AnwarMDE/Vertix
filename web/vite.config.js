import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// El frontend habla con el backend en localhost:4000 vía proxy /api
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5183,
    strictPort: true,
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
});

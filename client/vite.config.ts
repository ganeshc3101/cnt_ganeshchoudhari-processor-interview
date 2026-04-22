import { fileURLToPath, URL } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const resolvePath = (relative: string) => fileURLToPath(new URL(relative, import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolvePath('./src'),
      '@app': resolvePath('./src/app'),
      '@features': resolvePath('./src/features'),
      '@shared': resolvePath('./src/shared'),
      '@routes': resolvePath('./src/routes'),
      '@styles': resolvePath('./src/styles'),
      '@assets': resolvePath('./src/assets'),
    },
  },
  server: {
    port: 5173,
  },
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three') || id.includes('@react-three')) return 'vendor-3d';
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/zustand')) return 'vendor-react';
          if (id.includes('/src/ui/dashboard/')) return 'dashboard';
          if (id.includes('/src/ui/commander/')) return 'commander';
          if (id.includes('/src/runtime/')) return 'runtime';
        },
      },
    },
  },
});

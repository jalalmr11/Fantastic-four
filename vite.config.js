import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@supabase')) {
            return 'vendor-supabase';
          }
          if (id.includes('react-router-dom') || id.includes('react-dom') || id.includes('react')) {
            return 'vendor-react';
          }
        },
      },
    },
  },
})


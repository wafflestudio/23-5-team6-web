import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://3.34.178.145:8000',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://3.34.178.145:8000',
        changeOrigin: true,
      },
    },
  },
})

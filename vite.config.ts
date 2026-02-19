import { defineConfig } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@types': path.resolve(__dirname, './src/types'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@data': path.resolve(__dirname, '../data'),
    },
  },
  server: {
    port: 3000,
    host: true,
    allowedHosts: ['.trycloudflare.com', '.ngrok-free.app', '.ngrok.io', '.loca.lt', 'localhost'],
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    assetsInlineLimit: 4096,
  },
})

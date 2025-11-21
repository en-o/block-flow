import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      // 代理所有 /api 请求到后端服务器
      '/api': {
        target: 'http://localhost:1250',
        changeOrigin: true,
        // 后端路径已包含/api，不需要重写路径
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // 代理所有 /api 请求到后端服务器
      '/api': {
        target: 'http://localhost:8777',
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/api/, '') // 如果后端没有/api前缀，取消注释
      }
    }
  }
})

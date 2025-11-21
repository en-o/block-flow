import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '')
  const apiBaseUrl = env.VITE_API_BASE_URL || '/api'

  // Docker 构建模式：输出到 dist 目录
  // 本地开发的 merged 模式：输出到 Spring Boot 静态资源目录（保留用于本地调试）
  const isDockerBuild = process.env.DOCKER_BUILD === 'true'
  const isMergedMode = mode === 'production' && !isDockerBuild
  const outDir = isMergedMode
    ? path.resolve(__dirname, '../api/src/main/resources/static')
    : 'dist'

  return {
    // 设置基础路径
    base: env.VITE_BASE_PATH || '/',

    plugins: [react()],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },

    build: {
      // 输出目录
      outDir: outDir,
      // 静态资源目录
      assetsDir: 'assets',
      // 启用/禁用 CSS 代码拆分
      cssCodeSplit: true,
      // 构建后是否生成 source map 文件
      sourcemap: false,
      // chunk 大小警告的限制（单位：KB）
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        output: {
          // 静态资源分类打包
          chunkFileNames: 'js/[name]-[hash].js',
          entryFileNames: 'js/[name]-[hash].js',
          assetFileNames: '[ext]/[name]-[hash].[ext]',
          // 手动配置代码分割
          manualChunks: {
            // React 核心库
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            // Ant Design 相关
            'antd-vendor': ['antd'],
            // 其他第三方库
            'vendor': ['axios', 'blockly', '@monaco-editor/react', '@xyflow/react'],
          },
        },
      },
    },

    server: {
      port: 5173,
      host: '0.0.0.0',
      proxy: {
        // 代理所有 /api 请求到后端服务器
        [apiBaseUrl]: {
          target: 'http://localhost:1250',
          changeOrigin: true,
          rewrite: (path) => path.replace(new RegExp(`^${apiBaseUrl}`), ''),
        },
      },
      historyApiFallback: true,
    },

    preview: {
      port: 5173,
      historyApiFallback: true,
    },
  }
})

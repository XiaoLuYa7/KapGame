import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname)
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        bypass: (req) => {
          // 如果请求路径以 /apis 开头，不代理（这是前端模块）
          if (req.url.startsWith('/apis')) {
            return req.url
          }
        }
      },
      '/admin': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
})

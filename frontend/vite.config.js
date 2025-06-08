import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 設置環境變數前綴，Vite 默認只加載 VITE_ 開頭的變數
  envPrefix: 'VITE_',
  // 設置環境變數文件所在的目錄
  envDir: '../', // 指向項目根目錄，因為 .env 文件在根目錄
  server: {
    host: true, // 允許外部訪問
    port: 3000, // 前端開發服務端口
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // 開發環境下代理到後端服務
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
    },
  },
  build: {
    outDir: 'dist', // 構建輸出目錄
    emptyOutDir: true, // 清空輸出目錄
  },
})

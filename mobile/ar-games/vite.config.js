import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mkcert from 'vite-plugin-mkcert'

// https://vitejs.dev/config/
export default defineConfig({
  // Base path для GitHub Pages
  // Для локальной разработки используем '/', для GitHub Pages '/cognetive-kids/'
  base: process.env.VITE_BASE_PATH || (process.env.NODE_ENV === 'production' ? '/cognetive-kids/' : '/'),
  plugins: [
    react(),
    // mkcert только для локальной разработки
    ...(process.env.NODE_ENV === 'development' ? [mkcert({
      hosts: ['localhost', '127.0.0.1', '192.168.0.114', '::1']
    })] : [])
  ],
  server: {
    host: '0.0.0.0', // Слушаем на всех интерфейсах для доступа по IP
    https: true, // AR требует HTTPS для доступа к камере
    port: 3001, // Изменен порт, чтобы не конфликтовать с основным приложением
    cors: true, // Разрешаем CORS для WebView
    // Настройка для работы через прокси
    hmr: {
      protocol: 'wss',
      host: 'localhost',
      port: 3001
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // Отключаем sourcemap для production
    // Оптимизация для production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Удаляем console.log в production
      },
    },
  }
})


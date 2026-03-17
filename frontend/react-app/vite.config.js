import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  // In dev: proxy all /api and backend routes to Python server
  server: {
    proxy: {
      '/api':          'http://localhost:8000',
      '/login':        'http://localhost:8000',
      '/admin':        'http://localhost:8000',
      '/category':     'http://localhost:8000',
      '/contact':      'http://localhost:8000',
    }
  },

  // Build output goes to dist/ — Python server will serve from here
  build: {
    outDir: 'dist',
  }
})
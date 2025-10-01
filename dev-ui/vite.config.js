import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    https: {
      key: fs.readFileSync(path.resolve('../.dev-certs/localhost.key')),
      cert: fs.readFileSync(path.resolve('../.dev-certs/localhost.crt'))
    },
    host: 'localhost',
    port: 3000,
    watch: {
      usePolling: true,
    },
    hmr: {
      port: 3000,
      protocol: 'wss',
      host: 'localhost'
    },
    proxy: {
      '/api': {
        target: 'https://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    outDir: 'dist'
  }
})
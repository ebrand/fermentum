import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Check if SSL certificates exist (for development mode)
const keyPath = path.resolve(__dirname, '../../dev-certs/localhost.key')
const certPath = path.resolve(__dirname, '../../dev-certs/localhost.crt')
const hasSSLCerts = fs.existsSync(keyPath) && fs.existsSync(certPath)

export default defineConfig({
  plugins: [react()],
  server: {
    ...(hasSSLCerts && {
      https: {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath)
      }
    }),
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
        target: 'https://localhost:5001',  // API HTTPS endpoint
        changeOrigin: true,
        secure: false,  // Allow self-signed certificates in development
        ws: true,
        rewrite: (path) => path
      }
    }
  },
  build: {
    outDir: 'dist'
  }
})
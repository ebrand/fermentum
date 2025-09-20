import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5174,
    allowedHosts: 'all',
    watch: {
      usePolling: true,
    },
    hmr: {
      port: 5174,
      protocol: 'ws',
      host: 'localhost'
    }
  },
  build: {
    outDir: 'dist'
  }
})
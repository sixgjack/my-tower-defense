import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // 0.0.0.0 — reachable as http://<server-ip>:5173
    // Allow hostname + raw IP (e.g. http://10.120.32.92:5173 on LAN)
    allowedHosts: ['tower.cpss.edu.hk', '10.120.32.92', 'localhost', '127.0.0.1'],
    port: 5173,
    strictPort: true,
  },
  preview: {
    host: true,
    allowedHosts: ['tower.cpss.edu.hk', '10.120.32.92', 'localhost', '127.0.0.1'],
    port: 4173,
    strictPort: true,
  },
  resolve: {
    dedupe: ['react', 'react-dom']
  },
  optimizeDeps: {
    exclude: ['@electric-sql/pglite']
  }
})
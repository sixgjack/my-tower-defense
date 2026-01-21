import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // This exposes the app to the network
    allowedHosts: ['tower.cpss.edu.hk'],
    port: 5173  // Default Vite port
  },
  resolve: {
    dedupe: ['react', 'react-dom']
  },
  optimizeDeps: {
    exclude: ['@electric-sql/pglite']
  }
})
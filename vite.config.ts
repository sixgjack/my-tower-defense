import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // This exposes the app to the network
    port: 5174  // (Optional) Forces port 5173
  },
  resolve: {
    dedupe: ['react', 'react-dom']
  }
})
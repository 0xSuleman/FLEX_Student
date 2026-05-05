import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Single-tunnel demo path: students hit a Cloudflare/ngrok HTTPS URL pointing
// at this dev server, and /api/* gets proxied to the local Spring backend.
// `host: true` exposes the dev server on the LAN so phones on the same
// WiFi can reach it directly too (without a tunnel) when testing.
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8090',
        changeOrigin: true,
        secure: false,
      },
    },
    // Cloudflare tunnel wildcard plus localhost for direct access.
    allowedHosts: ['.trycloudflare.com', '.ngrok-free.app', '.ngrok.io', 'localhost'],
  },
})

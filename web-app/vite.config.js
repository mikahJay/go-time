import { defineConfig } from 'vite'

// Proxy `/api/*` to the local resource-server to avoid CORS and demonstrate
// the front-end can call the service during development.
export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})

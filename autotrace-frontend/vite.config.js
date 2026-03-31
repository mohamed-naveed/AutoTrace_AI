import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: {
        port: 3000,
        proxy: {
            // /api/v1/... → http://localhost:8000/api/v1/...
            '/api': {
                target: 'http://127.0.0.1:8000',
                changeOrigin: true,
                // No rewrite — path is forwarded as-is
            }
        }
    }
})

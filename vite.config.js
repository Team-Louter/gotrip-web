import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    server: {
      host: '127.0.0.1',
      port: 5179,
      strictPort: true,
      open: '/islogin',
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || 'https://api-gotrip.prot.kr',
          changeOrigin: true,
        },
        '/backend': {
          target: env.VITE_API_BASE_URL || 'https://api-gotrip.prot.kr',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/backend/, ''),
        },
      },
    },
  }
})

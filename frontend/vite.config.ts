import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: [
      'poll.jxngrx.in',
      'localhost',
      '127.0.0.1',
    ],
  },

  preview: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: [
      'poll.jxngrx.in',
      '.jxngrx.in', // Allow all subdomains of jxngrx.in
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
    ],
    strictPort: false,
  },
})

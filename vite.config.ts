import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Use relative paths for GitHub Pages
  server: { port: 5199, strictPort: true }, // 5173 is often taken by Docker; use a stable free port
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Rutas relativas: la app compilada funciona en cualquier carpeta del
  // servidor (ej. htdocs/Agribusiness en XAMPP, o la raíz del dominio en Plesk).
  base: './',
  build: {
    outDir: 'dist',
  },
  server: {
    // En desarrollo (npm run dev), las llamadas a la API van al PHP de XAMPP.
    proxy: {
      '/api': {
        target: 'http://localhost',
        rewrite: (path) => '/Agribusiness' + path,
      },
    },
  },
})

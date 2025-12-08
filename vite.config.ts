import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // To pozwala załadować zmienne środowiskowe, jeśli jakieś są, ale przede wszystkim daje dostęp do process.env w configu
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      // MAGIA DZIEJE SIĘ TUTAJ:
      // Przepisujemy zmienną z Windowsa (process.env.GOOGLE_API_KEY)
      // na zmienną dostępną w Vite (import.meta.env.VITE_API_KEY)
      'import.meta.env.VITE_API_KEY': JSON.stringify(process.env.GOOGLE_API_KEY)
    }
  }
})
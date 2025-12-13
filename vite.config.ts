import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Use '.' instead of process.cwd() to avoid TS error: Property 'cwd' does not exist on type 'Process'
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    server: {
      port: 5174
    },
    preview: {
      port: 5174
    },
    define: {
      // Polyfill process.env.API_KEY for the browser
      'process.env.API_KEY': JSON.stringify(env.API_KEY || env.GEMINI_API_KEY || '')
    }
  };
});
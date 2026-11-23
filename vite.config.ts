import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  // React es CommonJS: sin esto Storybook lo sirve sin convertir y la story no carga.
  optimizeDeps: { include: ['react', 'react-dom', 'react/jsx-runtime'] },
})

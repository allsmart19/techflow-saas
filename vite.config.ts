// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync } from 'fs'; // Importe a função de cópia

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-redirects',
      closeBundle() {
        // Este código roda ao final do processo de build
        copyFileSync('public/_redirects', 'dist/_redirects');
        console.log('✅ Arquivo _redirects copiado para a pasta dist!');
      },
    },
  ],
});
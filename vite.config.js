import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages: set VITE_BASE_PATH to '/your-repository/' when deploying to a repo.
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || './',
  build: { sourcemap: false }
});

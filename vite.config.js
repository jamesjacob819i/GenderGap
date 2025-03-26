import { defineConfig } from 'vite';

export default defineConfig({
  root: './',
  build: {
    outDir: 'dist',
  },
  server: {
    port: 3000
  },
  resolve: {
    alias: {
      'three': './js/three.module.js',
      'three/addons/': './js/'
    }
  }
});
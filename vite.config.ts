import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import usePluginImport from 'vite-plugin-importer'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    usePluginImport({
      libraryName: "antd",
      libraryDirectory: "es",
      style: "css",
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  base: './',
  build: {
    target: "esnext",
    // minify: "esbuild",
  },
})

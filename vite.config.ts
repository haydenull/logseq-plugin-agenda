import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import usePluginImport from 'vite-plugin-importer'

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
  base: './',
  build: {
    target: "esnext",
    // minify: "esbuild",
  },
})

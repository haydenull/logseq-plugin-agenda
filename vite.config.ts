import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig(async ({ command, mode }) => {
  return {
    plugins: [
      react(),
      // usePluginImport({
      //   libraryName: "antd",
      //   libraryDirectory: "es",
      //   style: "css",
      // }),
    ],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    base: './',
    build: {
      target: 'esnext',
      // minify: "esbuild",
    },
    css: {
      preprocessorOptions: {
        less: {
          javascriptEnabled: true,
        },
      },
    },
    define: {
      mockSettings:
        mode === 'production'
          ? await import('./mocks/settings.example.json')
          : await import('./mocks/settings.local.json'),
    },
  }
})

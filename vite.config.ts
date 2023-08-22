import react from '@vitejs/plugin-react'
import { existsSync } from 'fs'
import { resolve } from 'path'
import { defineConfig } from 'vite'

const getMockSettings = (isDev = false) => {
  const localSettingsPath = resolve(__dirname, 'mocks/settings.local.json')
  if (isDev && existsSync(localSettingsPath)) {
    return require(localSettingsPath)
  }
  return {}
}

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
      mockSettings: getMockSettings(mode === 'development'),
    },
  }
})

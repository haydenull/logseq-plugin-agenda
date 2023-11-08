import react from '@vitejs/plugin-react'
import { existsSync } from 'fs'
import { resolve } from 'path'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig } from 'vite'

import packageJSON from './package.json'

const getMockSettings = (isWeb = false) => {
  const localSettingsPath = resolve(__dirname, 'mocks/settings.local.json')
  if (isWeb && existsSync(localSettingsPath)) {
    return require(localSettingsPath)
  }
  return {}
}

// https://vitejs.dev/config/
export default defineConfig(async ({ command, mode }) => {
  return {
    plugins: [
      react(),
      visualizer(),
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
      mockSettings: getMockSettings(mode === 'web'),
      __APP_VERSION__: JSON.stringify(packageJSON.version),
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/tests/setupTest.ts'],
    },
  }
})

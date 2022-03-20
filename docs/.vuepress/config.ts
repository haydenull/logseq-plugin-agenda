import { defineUserConfig } from '@vuepress/cli'
import type { DefaultThemeOptions } from '@vuepress/theme-default'

import { sidebar } from './configs'

export default defineUserConfig<DefaultThemeOptions>({
  head:[
    ['link', { rel: 'icon', href: '/images/favicon.ico' }],
  ],
  locales: {
    // 键名是该语言所属的子路径
    // 作为特例，默认语言可以使用 '/' 作为其路径。
    '/': {
      lang: 'en-US', // 将会被设置为 <html> 的 lang 属性
      title: 'Logseq Plugin Agenda',
      description: 'A calendar for logseq'
    },
    '/zh/': {
      lang: 'zh-CN',
      title: 'Logseq Plugin Agenda',
      description: 'logseq 日历插件'
    }
  },
  themeConfig: {
    logo: '/images/logo.png',
    repo: 'haydenull/logseq-plugin-agenda',
    docsDir: 'docs',
    locales: {
      '/': {
        selectLanguageName: 'English',
        sidebar: sidebar.en,
      },
      '/zh/': {
        selectLanguageName: '简体中文',
        selectLanguageText: '选择语言',
        selectLanguageAriaLabel: '选择语言',
        sidebar: sidebar.zh,
      },
    },
    // selectLanguageText: 'xxxx',
    // selectLanguageAriaLabel: 'yyyy',
  },
  plugins: [
    [
      '@vuepress/plugin-search',
      {
        locales: {
          '/': {
            placeholder: 'Search',
          },
          '/zh/': {
            placeholder: '搜索',
          },
        },
        // hotKeys: ['ctrl', 'k']
      },
    ],
  ],
  // configureWebpack: {
  //   resolve: {
  //     alias: {
  //       '@img': 'screenshots/',
  //     },
  //   },
  // },
})
import { defineUserConfig } from '@vuepress/cli'
import type { DefaultThemeOptions } from '@vuepress/theme-default'
import { copyCode } from 'vuepress-plugin-copy-code2'

import { sidebar } from './configs'

export default defineUserConfig<DefaultThemeOptions>({
  head:[
    ['link', { rel: 'icon', href: './images/favicon.ico' }],
    ['script', {
      defer: true,
      'data-name': 'BMC-Widget',
      'data-cfasync': 'false',
      src: 'https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js',
      'data-id': 'haydenull',
      'data-description': 'Support me on Buy me a coffee!',
      'data-message': '',
      'data-color': '#40DCA5',
      'data-position': 'Right',
      'data-x_margin': '18',
      'data-y_margin': '18',
    }]
  ],
  base: '/logseq-plugin-agenda/',
  locales: {
    // 键名是该语言所属的子路径
    // 作为特例，默认语言可以使用 '/' 作为其路径。
    '/': {
      lang: 'en-US', // 将会被设置为 <html> 的 lang 属性
      title: 'Logseq Plugin Agenda',
      description: 'A calendar plugin for logseq'
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
    copyCode({}),
  ],
  // configureWebpack: {
  //   resolve: {
  //     alias: {
  //       '@img': 'screenshots/',
  //     },
  //   },
  // },
})
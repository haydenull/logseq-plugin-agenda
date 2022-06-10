import type { SidebarConfig } from '@vuepress/theme-default'

export const en: SidebarConfig = {
  '/': [
    {
      text: 'Introduction',
      children: [
        '/README.md',
        // '/introduction/demo.md',
      ],
    },
    {
      text: 'Settings',
      children: [
        '/settings/README.md',
      ],
    },
    {
      text: 'Calendar Event',
      children: [
        '/event/journal.md',
        '/event/dailylog.md',
      ],
    },
    {
      text: 'Custom Calendar',
      children: [
        '/calendar/custom.md',
        '/calendar/agenda.md',
        '/calendar/subscription.md',
      ],
    },
    {
      text: 'View',
      children: [
        '/views/gantt.md',
      ],
    },
    {
      text: 'Other',
      children: [
        '/other/query.md',
        '/other/testQuery.md',
        '/other/command.md',
      ],
    }
  ],
}
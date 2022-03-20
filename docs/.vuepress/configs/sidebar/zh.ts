import type { SidebarConfig } from '@vuepress/theme-default'

export const zh: SidebarConfig = {
  '/zh': [
    {
      text: '介绍',
      children: [
        '/zh/README.md',
        '/zh/introduction/demo.md',
      ],
    },
    {
      text: '设置',
      children: [
        '/zh/settings/README.md',
      ],
    },
    {
      text: '日历事件',
      children: [
        '/zh/event/journal.md',
        '/zh/event/dailylog.md',
      ],
    },
    {
      text: '自定义日历',
      children: [
        '/zh/calendar/customCalendar.md',
        '/zh/calendar/agendaCalendar.md',
        '/zh/calendar/subscriptionCalendar.md',
      ],
    }
  ],
  // '/zh/event': [
  // ],
  // '/zh/settings': [],
}
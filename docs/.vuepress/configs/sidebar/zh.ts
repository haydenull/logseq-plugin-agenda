import type { SidebarConfig } from '@vuepress/theme-default'

export const zh: SidebarConfig = {
  '/zh': [
    {
      text: '介绍',
      children: [
        '/zh/README.md',
        // '/zh/introduction/demo.md',
        '/zh/introduction/events.md',
        '/zh/introduction/sidebar.md',
        '/zh/introduction/pomodoro.md',
      ],
    },
    // {
    //   text: '日历事件',
    //   children: [
    //     '/zh/event/journal.md',
    //     '/zh/event/dailylog.md',
    //   ],
    // },
    {
      text: '设置',
      children: [
        // '/zh/settings/README.md',
        '/zh/settings/basis.md',
        '/zh/settings/project.md',
        '/zh/settings/customCalendar.md',
        '/zh/settings/subscription.md',
        '/zh/settings/calendarView.md',
        '/zh/settings/pomodoro.md',
      ],
    },
    // {
    //   text: '自定义日历',
    //   children: [
    //     '/zh/calendar/custom.md',
    //     '/zh/calendar/agenda.md',
    //     '/zh/calendar/subscription.md',
    //   ],
    // },
    // {
    //   text: '视图',
    //   children: [
    //     '/zh/views/gantt.md',
    //   ],
    // },
    {
      text: '其他',
      children: [
        // '/zh/other/query.md',
        // '/zh/other/testQuery.md',
        '/zh/other/create.md',
        '/zh/other/modify.md',
        '/zh/other/command.md',
      ],
    }
  ],
  // '/zh/event': [
  // ],
  // '/zh/settings': [],
}
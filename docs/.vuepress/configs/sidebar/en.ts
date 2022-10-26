import type { SidebarConfig } from '@vuepress/theme-default'

export const en: SidebarConfig = {
  '/': [
    {
      text: 'Introduction',
      children: [
        '/README.md',
        // '/introduction/demo.md',
        '/introduction/events.md',
        '/introduction/sidebar.md',
        '/introduction/pomodoro.md',
      ],
    },
    // {
    //   text: 'Calendar Event',
    //   children: [
    //     '/event/journal.md',
    //     '/event/dailylog.md',
    //   ],
    // },
    {
      text: 'Settings',
      children: [
        // '/settings/README.md',
        '/settings/basis.md',
        '/settings/project.md',
        '/settings/customCalendar.md',
        '/settings/subscription.md',
        '/settings/calendarView.md',
        '/settings/pomodoro.md',
        '/settings/todoist.md',
      ],
    },
    // {
    //   text: 'Custom Calendar',
    //   children: [
    //     '/calendar/custom.md',
    //     '/calendar/agenda.md',
    //     '/calendar/subscription.md',
    //   ],
    // },
    // {
    //   text: 'View',
    //   children: [
    //     '/views/gantt.md',
    //   ],
    // },
    {
      text: 'Other',
      children: [
        // '/other/query.md',
        // '/other/testQuery.md',
        '/other/create.md',
        '/other/modify.md',
        '/other/command.md',
      ],
    }
  ],
}
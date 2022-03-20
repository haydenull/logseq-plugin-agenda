# Introduction
> A calendar plugin for logseq

[![latest release version](https://img.shields.io/github/v/release/haydenull/logseq-plugin-agenda)](https://github.com/haydenull/logseq-plugin-agenda/releases)

::: warning Notice
The original journalDateFormatter configuration required the user to read the dayjs document to fill in correctly, Version 1.8.1 removes the journalDateFormatter setting. Instead, I got it from logseq on my own, which unfortunately affected the original date parsing. If you get the error `Use yyyyy instead of YYYY (in YYYYMMDD) for formatting`, please click the fx button in the settings to change all `YYYYMMDD` to `yyyyMMdd`
:::


## 🎨 Features
- Supports multiple views: single day, week, double week, month
- Supports changing start day of week
- Supports flexible custom calendar(both simple query and advanced query)
- Supports debugging query
- Supports overdue tasks
- Supports Milestone
- Supports daily log and export weekly log
- Supports subscription calendar(basic event)
- Supports dark mode
- Supports create and edit schedule

![MonthView](../screenshots/monthView.png)
![WeeklyView](../screenshots/weeklyView.png)
![settings](../screenshots/settings.png)
![query](../screenshots/query.png)
![agenda](../screenshots/modifyAgenda.png)
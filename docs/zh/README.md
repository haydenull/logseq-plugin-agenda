# logseq-plugin-agenda
> A plugin for logseq to show agenda

[![latest release version](https://img.shields.io/github/v/release/haydenull/logseq-plugin-agenda)](https://github.com/haydenull/logseq-plugin-agenda/releases)


::: warning 注意
原本的 journalDateFormatter 配置需要用户理解 dayjs 文档才能正确填写，1.8.1 版本移除了 journalDateFormatter 设置，改为自行从 logseq 获取，非常遗憾的是这个改动影响了原本的日期解析，如果你遇到报错 `Use yyyy instead of YYYY (in YYYYMMDD) for formatting` ，请在设置中点击 fx 按钮，将所有的 `YYYYMMDD` 改为 `yyyyMMdd`
:::


现在插件使用 [date-fns](https://date-fns.org/v2.28.0/docs/parse) 解析日期。

## 功能
- 支持多种视图: 单日 周 双周 月
- 支持设置周开始日期
- 支持非常灵活的自定义日历(同时支持 simple query 和 advanced query)
- 支持调试 query
- 支持显示过期任务
- 支持显示里程碑
- 支持收集每日日志, 导出周报
- 支持订阅日历（基础事件）
- 支持深色模式
- 支持新建 编辑日程

![MonthView](../../screenshots/monthView.png)
![WeeklyView](../../screenshots/weeklyView.png)
![settings](../../screenshots/settings.png)
![query](../../screenshots/query.png)
![agenda](../../screenshots/modifyAgenda.png)

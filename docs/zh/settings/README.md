# 设置

## Theme
主题
- Auto：依据 logseq 主题自动选择
- Light：亮色主题
- Dark：暗色主题
<!-- TODO: 暗色与亮色截图 -->

## Default View
默认视图
- Daily: 日视图
- Weekly: 周视图
- 2 Weeks: 双周视图
- Monthly: 月视图
<!-- TODO: 截图 -->

## Week Start Day
周开始日
- Sunday: 星期日
- Monday: 星期一

## ~~Journal Date Formatter(废弃)~~
~~日记日期格式~~

~~依据自己每日日记的格式填写,例如我的日记是 `2022-03-07 Mon`,那么就填写 `YYYYMMDD ddd`~~

::: warning 注意
1.8.1 版本移除了 journalDateFormatter 设置，改为自行从 logseq 获取，非常遗憾的是这个改动影响了原本的日期解析，如果你遇到报错 `Use yyyy instead of YYYY (in YYYYMMDD) for formatting` ，请在设置中点击 fx 按钮，将所有的 `YYYYMMDD` 改为 `yyyyMMdd`
:::

## Log Key
每日日志的关键字

插件会依据该关键字,将所有日记中该 block 下的内容收集起来, 在日历中展示

有以下三种情况:
1. 具有时间点的 block, 如: 14:00 foo, 则会被认为是 `time` 日程
3. 具有时间范围的 block, 如: 14:00-16:00 foo, 则会被认为是 `time` 日程
2. 没有时间点的 block, 如: foo, 则会被认为是 `all day` 日程

以 Log Key 为 `Daily Log` 为例：
<!-- TODO: 截图 -->

## Calendars
日历

下载插件后会默认创建一个名为 journal 的默认日历, 点击 [这里](/zh/event/journal) 查看详情

如果你想添加自己的日历, 请在设置中添加，点击 [这里](/zh/calendar) 查看自定义日历文档

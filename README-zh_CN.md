# logseq-plugin-agenda
> A plugin for logseq to show agenda

[![latest release version](https://img.shields.io/github/v/release/haydenull/logseq-plugin-agenda)](https://github.com/haydenull/logseq-plugin-agenda/releases)
[![License](https://img.shields.io/github/license/haydenull/logseq-plugin-agenda?color=blue)](https://github.com/haydenull/logseq-plugin-agenda/blob/main/LICENSE)

[English](./README.md) | 简体中文

## Demo

我们将带有 `"TODO" "DOING" "NOW" "LATER" "WAITING" "DONE"` 的笔记称作任务。
### 展示所有笔记中的日程
![defaultCalendar](./defaultCalendar.gif)
journal 日历会收集所有设置了`scheduled` 或 `deadline`的任务，并且以`scheduled` `deadline`为开始时间。

当 `scheduled` `deadline` 设置了时间时, 会认为是 `time` 日程。会显示在时间线中。

否则认为是 `allday` 日程。

### 创建自己的日历
![customCalendar](./customCalendar.gif)

### 展示日记中的日程
![journal](./journal.gif)
journal 日历会收集所有 journals 中的没有 `scheduled` `deadline` 的任务，并且以 journals 的日期为任务时间。

它会被认作 `allday` 任务。

### 展示每日日志
![dailyLog](./dailyLog.gif)

## 设置

### Default View
默认视图

### Week Start Day
周开始日

### Journal Date Formatter
日记日期格式

依据自己每日日记的格式填写,例如我的日记是 `2022-03-07 Mon`,那么就填写 `YYYYMMDD ddd`

[文档](https://day.js.org/docs/en/display/format)

### Log Key
每日日志的关键字

插件会依据该关键字,将所有日记中该 block 下的内容收集起来, 在日历中展示

有以下三种情况:
1. 具有时间点的 block, 如: 14:00 foo, 则会被认为是 `time` 日程
3. 具有时间范围的 block, 如: 14:00-16:00 foo, 则会被认为是 `time` 日程
2. 没有时间点的 block, 如: foo, 则会被认为是 `all day` 日程

### Calendars
日历

#### 默认日历 journal

![journalCalendar](./JournalCalendar.png)

默认的 journal 日历将会收集以下信息并展示在日历中:
1. 所有有 scheduled 或 deadline 的任务(使用 `scheduled` `deadline` 作为任务计划时间)
2. 所有 journals 中没有 scheduled 或 deadline 的任务(使用 journals 的日期作为任务计划时间)
3. 所有具有 milestone 标签的 block

#### 自定义日历
行为同 journal 日历, 但是查找范围变为了自定义日历 id 指定的页面

> 所有日历的 query 都是开放可修改的, 你可以根据需求自己定制

等待完善文档
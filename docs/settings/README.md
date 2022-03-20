# Settings

## Theme
- Auto：Automatic selection based on logseq theme
- Light：Light theme
- Dark：Dark theme
![light](../../screenshots/light.png)
![dark](../../screenshots/dark.png)

## Default View
- Daily: Daily view
- Weekly: Weekly view
- 2 Weeks: 2 Weeks view
- Monthly: Monthly view

## Week Start Day
- Sunday
- Monday

## ~~Journal Date Formatter(Removed)~~
~~default journal date formatter~~

~~Fill in the format of your daily diary, for example my diary is `2022-03-07 Mon`, then fill in the` YYYYMMDD DDD`.~~

::: warning Notice
The original journalDateFormatter configuration required the user to read the dayjs document to fill in correctly, Version 1.8.1 removes the journalDateFormatter setting. Instead, I got it from logseq on my own, which unfortunately affected the original date parsing. If you get the error `Use 'yyyyy' instead of 'YYYY' (in 'YYYYMMDD') for formatting`, please click the fx button in the settings to change all `YYYYMMDD` to `yyyyMMdd`

The plugin now uses [date-fns](https://date-fns.org/v2.28.0/docs/parse) to parse dates.
:::

## Log Key
Daily log key.

click [here](/event/dailylog) to see details

## Default Duration
event default duration

add default duration based on start time

## Calendar

Plugin will create a default calendar named journal after download. Click [here](/event/journal) to see details.

If you want to add your own calendar, click [here](/calendar) to see custom calendar document.


## Subscription
Subscribe online calendar, click [here](/calendar/subscription) to see details.
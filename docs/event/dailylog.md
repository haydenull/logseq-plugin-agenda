# Daily log record

Based on `Log Key` setting, the plugin will collect all the contents under the block in the journal and display it in the calendar

There are three situations:
1. Block with time points, such as: 14:00 foo, will be considered `Time` event
3. Have a time range, such as: 14: 00-16: 00 foo, will be considered `Time` event
2. There is no time point in the block, such as: foo, will be considered `all day` event

Take the Log Key as `Daily Log` as an example:

journal:
![](../../screenshots/dailyLogExample1.png)
calendar:
![](../../screenshots/dailyLogExample2.png)

When Log Key is enabled, the weekly view will display the `Export Weekly` button, and the weekly agenda will show up and support copy

![](../../screenshots/exportWeekly.png)
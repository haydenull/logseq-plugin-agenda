# Subscription

Subscription is the same as a custom calendar configuration, except that there is no query and url are added. 

::: tip
At present, only simple events are supported, and there are no functions such as periodic events.
:::

To add a calendar, click the gear icon to go to your settings and select the **Subscription** menu item.

## Example

### Chinese holiday

url: `https://www.shuyz.com/githubfiles/china-holiday-calender/master/holidayCal.ics`

from: [china-holiday-calender](https://github.com/lanceliao/china-holiday-calender)

![](../../screenshots/chinaHoliday.png)

### Google Calendar

Go to **'Settings for my calendars'**

Click on the gear icon or right-click on your calendar name to access your calendar settings.

Under the **'Access permissions for events'** section, select **'Make available to public'**. Note that this will make your calendar indexable in searches. Choose **'see only free/busy (hide details)'** to avoid your events being searchable. Read this guide to make sure you're aware of the implications of sharing your calendar: https://support.google.com/calendar/answer/37082?hl=en

Under the **'Integrate calendar'** section, copy the **'Public address in iCal format** and paste that into the url field in Logseq 

![](../../screenshots/googleCalendar.png)

### Apple Calendar

Replace `webcal://` with `https://`

![](../../screenshots/appleCalendar.gif)

### TickTick

Replace `webcal://` with `https://`
![](../../screenshots/didaCalendar.png)

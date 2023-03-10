import dayjs from 'dayjs'
import { transformBlockToEvent } from '@/helper/transform'
import { startPomodoro } from '@/register/pomodoro'
import { renderModalApp } from '@/main'
import { getInitialSettings } from '@/util/baseInfo'

const initializeEditScheduleModal = () => {
  const editSchedule = async (e) => {
    let block = await logseq.Editor.getBlock(e.uuid)
    const blockRefs = await Promise.all(block!.refs?.map(ref => logseq.Editor.getPage(ref.id)))
    block!.refs = blockRefs
    const event = await transformBlockToEvent(block!, getInitialSettings())
    renderModalApp({
      type: 'editSchedule',
      data: {
        type: 'update',
        initialValues: {
          id: event.uuid,
          start: dayjs(event.addOns.start),
          end: dayjs(event.addOns.end),
          isAllDay: event.addOns.allDay,
          calendarId: event.addOns.calendarConfig?.id,
          title: event.addOns.showTitle,
          // keepRef: schedule.calendarId?.toLowerCase() === 'journal',
          raw: event,
        },
      },
      showKeepRef: true,
    })
    logseq.showMainUI()
  }

  logseq.Editor.registerBlockContextMenuItem('Agenda: Modify Schedule', editSchedule)
  logseq.Editor.registerSlashCommand('Agenda: Modify Schedule', editSchedule)
}

export default initializeEditScheduleModal
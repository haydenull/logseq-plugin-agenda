import dayjs from 'dayjs'

import { transformBlockToEvent } from '@/helper/transform'
import { renderModalApp } from '@/main'
import { getInitialSettings } from '@/util/baseInfo'
import { getBlockUuidFromEventPath } from '@/util/logseq'

const initializeClickLogseqDomListener = () => {
  if (top) {
    top.document.addEventListener('click', async (e) => {
      const path = e.composedPath()
      const target = path[0] as HTMLAnchorElement
      if (
        target.tagName === 'A' &&
        target.className.includes('external-link') &&
        target.getAttribute('href')?.startsWith('#agenda')
      ) {
        const modalType = target.getAttribute('href')?.startsWith('#agenda-pomo://') ? 'pomodoro' : 'agenda'

        const uuid = getBlockUuidFromEventPath(path as unknown as HTMLElement[])
        if (!uuid) return
        const block = await logseq.Editor.getBlock(uuid)
        const page = await logseq.Editor.getPage(block!.page?.id)
        const event = await transformBlockToEvent(block!, getInitialSettings())
        if (modalType === 'agenda') {
          // edit schedule modal
          renderModalApp({
            type: 'modifySchedule',
            data: {
              type: 'update',
              initialValues: {
                id: uuid,
                title: event.addOns.showTitle,
                calendarId: page?.originalName,
                keepRef: false,
                start: dayjs(event.addOns.start),
                end: dayjs(event.addOns.end),
                isAllDay: event.addOns.allDay,
                raw: event,
              },
            },
          })
        } else if (modalType === 'pomodoro') {
          // pomodoro modal
          renderModalApp({
            type: 'pomodoro',
            data: event,
          })
        }
        logseq.showMainUI()
      }
    })
  }
}

export default initializeClickLogseqDomListener

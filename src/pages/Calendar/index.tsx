import React, { useState } from 'react'

const index: React.FC<{}> = () => {

  useEffect(() => {
    managePluginTheme()
    // Delay execution to avoid the TUI not being able to acquire the height correctly
    // The bug manifests as the weekly view cannot auto scroll to the current time
    setTimeout(() => {
      calendarRef.current = new Calendar('#calendar', {
        ...calendarOptions,
        // template: {
        //   // monthDayname: function(dayname) {
        //   //   return '<span class="calendar-week-dayname-name">' + dayname.label + '</span>';
        //   // }
        // }
      })
      changeShowDate()
      setSchedules()
      calendarRef.current.on('clickDayname', function(event) {
        const calendar = calendarRef.current
        if (calendar?.getViewName() === 'week') {
          calendar.setDate(new Date(event.date))
          calendar.changeView('day', true)
          changeShowDate()
          setCurrentView('day')
        }
      })
      calendarRef.current.on('clickSchedule', function(info) {
        document.querySelector('#faiz-nav-detail')?.addEventListener('click', async (e) => {
          const rawData = info.schedule.raw || {}
          const { id: pageId, originalName } = rawData?.page || {}
          let pageName = originalName
          // datascriptQuery 查询出的 block, 没有详细的 page 属性, 需要手动查询
          if (!pageName) {
            const page = await logseq.Editor.getPage(pageId)
            pageName = page?.originalName
          }
          const { uuid: blockUuid } = await logseq.Editor.getBlock(rawData.id) || { uuid: '' }
          logseq.Editor.scrollToBlockInPage(pageName, blockUuid)
          logseq.hideMainUI()
        }, { once: true })
      })
      calendarRef.current.on('beforeCreateSchedule', function(event) {
        setModifyScheduleModal({
          visible: true,
          type: 'create',
          values: {
            start: dayjs(event.start),
            end: dayjs(event.end),
            isAllDay: event.triggerEventName === 'dblclick',
          }
        })
      })
      calendarRef.current.on('beforeUpdateSchedule', async function(event) {
        console.log('[faiz:] === beforeUpdateSchedule', event)
        const { schedule, changes, triggerEventName, start: finalStart, end: finalEnd } = event
        if (triggerEventName === 'click') {
          // click edit button of detail popup
          setModifyScheduleModal({
            visible: true,
            type: 'update',
            values: {
              id: schedule.id,
              start: dayjs(schedule.start),
              end: dayjs(schedule.end),
              isAllDay: schedule.isAllDay,
              calendarId: schedule.calendarId,
              title: schedule.raw?.content?.split('\n')[0],
              raw: schedule.raw,
            },
          })
        } else if (changes) {
          // drag on calendar view
          if (schedule.calendarId === 'journal' && !dayjs(finalStart).isSame(dayjs(finalEnd), 'day')) return logseq.App.showMsg('Journal schedule cannot span multiple days', 'error')
          let properties = {}
          let scheduleChanges = {}
          Object.keys(changes).forEach(key => {
            if (schedule.isAllDay) {
              properties[key] = dayjs(changes[key]).format('YYYY-MM-DD')
            } else {
              properties[key] = dayjs(changes[key]).format('YYYY-MM-DD HH:mm')
            }
            scheduleChanges[key] = dayjs(changes[key]).format()
          })
          calendarRef.current?.updateSchedule(schedule.id, schedule.calendarId, changes)
          if (schedule.calendarId === 'journal') {
            // update journal schedule
            const marker = schedule?.raw?.marker
            const _content = schedule?.isAllDay ? false : `${marker} ` + modifyTimeInfo(schedule?.raw?.content?.replace(new RegExp(`^${marker} `), ''), dayjs(schedule?.start).format('HH:mm'), dayjs(schedule?.end).format('HH:mm'))
            let journalDay = schedule?.raw?.page?.journalDay
            if (!journalDay) {
              const page = await getPageData(schedule?.raw?.page?.id)
              journalDay = page?.journalDay
            }
            if (changes.start && !dayjs(changes.start).isSame(dayjs(String(journalDay), 'YYYYMMDD'), 'day')) {
              // if the start day is different from the original start day, then execute move operation
              console.log('[faiz:] === move journal schedule')
              const { preferredDateFormat } = await logseq.App.getUserConfigs()
              const journalName = format(dayjs(changes.start).valueOf(), preferredDateFormat)
              const newBlock = await moveBlockToNewPage(schedule.raw?.id, journalName)
              console.log('[faiz:] === newBlock', newBlock, schedule, schedule?.id)
              if (newBlock) {
                calendarRef.current?.deleteSchedule(String(schedule.id), schedule.calendarId)
                calendarRef.current?.createSchedules([await genSchedule({
                  ...schedule,
                  blockData: newBlock,
                  calendarConfig: calendarList?.find(calendar => calendar.id === 'journal'),
                })])
              }
            } else {
              await updateBlock(schedule.raw?.id, _content)
            }
          } else {
            // update other schedule (agenda calendar)
            await updateBlock(Number(schedule.id), false, properties)
          }
        }
      })
      calendarRef.current.on('beforeDeleteSchedule', function(event) {
        const { schedule } = event
        Modal.confirm({
          title: 'Are you sure delete this schedule?',
          content: <div className="whitespace-pre-line">{schedule.raw?.content}</div>,
          onOk: async () => {
            const block = await logseq.Editor.getBlock(schedule.raw?.id)
            if (!block) return logseq.App.showMsg('Block not found', 'error')
            logseq.Editor.removeBlock(block?.uuid)
            calendarRef.current?.deleteSchedule(schedule.id, schedule.calendarId)
          },
        })
      })
    }, 0)
  }, [])

  return (
    <div>
      <div id="calendar" style={{ height: '100%' }}></div>
    </div>
  )
}

export default index

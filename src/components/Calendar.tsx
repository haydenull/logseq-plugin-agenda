import React, { useEffect, useRef, useState } from 'react'
import Calendar, { ISchedule } from 'tui-calendar'
import { format, isSameDay, parse } from 'date-fns'
import { getDefaultCalendarOptions, getInitalSettings, genDailyLogCalendarOptions } from '@/util/baseInfo'
import { CALENDAR_VIEWS, SHOW_DATE_FORMAT } from '@/util/constants'
import { deleteProjectTaskTime, updateProjectTaskTime } from '@/util/schedule'
import ModifySchedule, { IScheduleValue } from '@/components/ModifySchedule'
import Sidebar from '@/components/Sidebar'
import dayjs from 'dayjs'
import { moveBlockToNewPage, moveBlockToSpecificBlock } from '@/util/logseq'
import { Button, Modal, Radio, Tooltip } from 'antd'
import { LeftOutlined, RightOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons'
import { ICustomCalendar } from '@/util/type'
import { IEvent } from '@/util/events'

// import { schedulesAtom } from '@/model/schedule'

const CalendarCom: React.FC<{
  schedules: ISchedule[]
  isProjectCalendar?: boolean
  isDailyLogCalendar?: boolean
}> = ({ schedules, isProjectCalendar = true, isDailyLogCalendar = false }) => {
  // const [schedules] = useAtom(schedulesAtom)

  const { subscriptionList, logKey, projectList = [], journal } = getInitalSettings()

  const [showDate, setShowDate] = useState<string>()
  const [isFold, setIsFold] = useState(true)
  const [currentView, setCurrentView] = useState(() => {
    if (isDailyLogCalendar) return 'week'
    return logseq.settings?.defaultView || 'month'
  })
  const enabledCalendarList: ICustomCalendar[] = [journal!, ...projectList]
  const enabledSubscriptionList: ICustomCalendar[] = subscriptionList ? subscriptionList?.filter(subscription => subscription?.enabled) : []
  const [modifyScheduleModal, setModifyScheduleModal] = useState<{
    visible: boolean
    type?: 'create' | 'update'
    values?: IScheduleValue
  }>({
    visible: false,
    type: 'create',
  })
  const calendarRef = useRef<Calendar>()

  const changeShowDate = () => {
    if (calendarRef.current) {
      const dateRangeStart = calendarRef.current.getDateRangeStart().getTime()
      const dateRangeEnd = calendarRef.current.getDateRangeEnd().getTime()
      if (isSameDay(dateRangeStart, dateRangeEnd)) {
        setShowDate(format(dateRangeStart, SHOW_DATE_FORMAT))
      } else {
        setShowDate(format(dateRangeStart, SHOW_DATE_FORMAT) + ' ~ ' + format(dateRangeEnd, SHOW_DATE_FORMAT))
      }
    }
  }

  const onViewChange = (value: string) => {
    setCurrentView(value)
    if (value === '2week') {
      calendarRef.current?.changeView('month')
      calendarRef.current?.setOptions({
        month: {
          visibleWeeksCount: 2,
        },
      })
    } else if(value === 'month') {
      calendarRef.current?.changeView('month')
      calendarRef.current?.setOptions({
        month: {
          visibleWeeksCount: undefined,
        },
      })
    } else {
      calendarRef.current?.changeView(value)
    }
    changeShowDate()
  }
  const onShowCalendarChange = (showCalendarList: string[]) => {
    const enabledCalendarIds = enabledCalendarList.concat(enabledSubscriptionList)?.map(calendar => calendar.id)

    enabledCalendarIds.forEach(calendarId => {
      if (showCalendarList.includes(calendarId)) {
        calendarRef.current?.toggleSchedules(calendarId, false)
      } else {
        calendarRef.current?.toggleSchedules(calendarId, true)
      }
    })
  }
  const toggleFold = () => setIsFold(_isFold => !_isFold)
  const onClickToday = () => {
    calendarRef.current?.today()
    changeShowDate()
  }
  const onClickPrev = () => {
    calendarRef.current?.prev()
    changeShowDate()
  }
  const onClickNext = () => {
    calendarRef.current?.next()
    changeShowDate()
  }
  const onClickShowDate = async () => {
    if (currentView === 'day' && showDate) {
      const { preferredDateFormat } = await logseq.App.getUserConfigs()
      const date = format(parse(showDate, SHOW_DATE_FORMAT, new Date()), preferredDateFormat)
      logseq.App.pushState('page', { name: date })
      logseq.hideMainUI()
    }
  }

  useEffect(() => {
    if (calendarRef.current) {
      console.log('[faiz:] === schedules changed and refresh calendar', schedules)
      calendarRef.current.clear()
      calendarRef.current.createSchedules(schedules)
    }
  }, [schedules, calendarRef.current])
  useEffect(() => {
    // managePluginTheme()
    // Delay execution to avoid the TUI not being able to acquire the height correctly
    // The bug manifests as the weekly view cannot auto scroll to the current time
    window.requestAnimationFrame(async () => {
      let calendarOptions = await getDefaultCalendarOptions()
      if (isDailyLogCalendar) calendarOptions = genDailyLogCalendarOptions(calendarOptions)
      console.log('[faiz:] === calendarOptions', calendarOptions)
      calendarRef.current = new Calendar('#calendar', {
        ...calendarOptions,
      })
      changeShowDate()
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
              isAllDay: schedule?.raw?.category !== 'time',
              calendarId: schedule.calendarId,
              title: schedule.title,
              raw: schedule.raw,
            },
          })
        } else if (changes) {
          // drag on calendar view
          if (schedule.calendarId === 'journal' && !dayjs(finalStart).isSame(dayjs(finalEnd), 'day')) return logseq.App.showMsg('Journal schedule cannot span multiple days', 'error')
          // let properties = {}
          // let scheduleChanges = {}
          const event: IEvent = schedule.raw
          const scheduleType = (schedule as ISchedule).calendarId === 'Journal' ? 'journal' : 'project'

          const start = changes?.start ? changes.start : event.rawTime?.start
          const end = changes?.end ? changes.end : event.rawTime?.end

          // drag journal schedule
          if (scheduleType === 'journal' && changes.start) {
            // Jourbal tasks are not allowed for multiple days
            calendarRef.current?.updateSchedule(schedule.id, schedule.calendarId, changes)
            const { preferredDateFormat } = await logseq.App.getUserConfigs()

            let content = event.content
            if (event.rawTime?.timeFrom === 'customLink') content = deleteProjectTaskTime(content.trim())
            if (event.rawTime?.timeFrom === 'refs') {
              const journalName = format(dayjs(event.rawTime.start).valueOf(), preferredDateFormat)
              content = content.replace(`[[${journalName}]]`, '')?.trim()
            }

            const journalName = format(start.valueOf(), preferredDateFormat)
            const newPage = await logseq.Editor.createPage(journalName, {}, { journal: true })
            const newCalendarId = newPage!.originalName
            await logseq.Editor.updateBlock(schedule.id, content)
            logKey?.enabled ? await moveBlockToSpecificBlock(schedule?.id!, newCalendarId!, `[[${logKey?.id}]]`) : await moveBlockToNewPage(schedule?.id!, newCalendarId!)
          } else if (scheduleType === 'project') {
            calendarRef.current?.updateSchedule(schedule.id, schedule.calendarId, changes)
            const content = updateProjectTaskTime(event.addOns.contentWithoutTime, { start: dayjs(start), end: dayjs(end), allDay: event.addOns.allDay })
            await logseq.Editor.updateBlock(schedule.id, content)
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
    })
    // setTimeout(() => {
    // }, 0)
  }, [])

  return (
    <div className="flex flex-col w-full h-full">
      {/* ========= title bar start ========= */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center">
          { (!isProjectCalendar && !isDailyLogCalendar) && (<Button className="mr-2" onClick={toggleFold} icon={isFold ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} />) }

          <Button className="ml-2" shape="circle" icon={<LeftOutlined />} onClick={onClickPrev}></Button>
          <Button className="ml-1" shape="circle" icon={<RightOutlined />} onClick={onClickNext}></Button>
          <Button className="ml-2" shape="round" onClick={onClickToday}>Today</Button>
          <Tooltip title={ currentView === 'day' ? 'Navigate to this journal note' : '' }>
            <span
              className={`ml-4 text-xl h-full items-center inline-block title-text ${currentView === 'day' ? 'cursor-pointer' : 'cursor-auto'}`}
              style={{ height: '34px', lineHeight: '34px' }}
              onClick={onClickShowDate}
            >
              { showDate }
            </span>
          </Tooltip>
      </div>

        <div>
          <Radio.Group
            options={CALENDAR_VIEWS}
            value={currentView}
            defaultValue={logseq.settings?.defaultView || 'month'}
            onChange={e => onViewChange(e.target.value)}
            optionType="button"
            buttonStyle="solid"
          />
        </div>
      </div>
      {/* ========= title bar end ========= */}

      {/* ========= content start ========= */}
      <div className="flex flex-1">
        <div className={`transition-all overflow-hidden bg-quaternary title-text mr-2 ${isFold ? 'w-0 mr-0' : 'w-40'}`}>
          <Sidebar
            onShowCalendarChange={onShowCalendarChange}
            calendarList={enabledCalendarList}
            subscriptionList={enabledSubscriptionList}
            />
        </div>
        <div className="flex-1 w-0">
          <div id="calendar" className="h-full title-text"></div>
        </div>
      </div>
      {/* ========= content end ========= */}

      {
        modifyScheduleModal.visible
        ? <ModifySchedule
          visible={modifyScheduleModal.visible}
          type={modifyScheduleModal.type}
          initialValues={modifyScheduleModal.values}
          calendar={calendarRef.current}
          onCancel={() => {
            setModifyScheduleModal({ visible: false })
            calendarRef.current?.render()
          }}
          onSave={() => {
            setModifyScheduleModal({ visible: false })
          }}
        />
        : null
      }
    </div>
  )
}

export default CalendarCom

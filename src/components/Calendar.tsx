import React, { useEffect, useRef, useState } from 'react'
import Calendar, { ISchedule } from 'tui-calendar'
import { format, isSameDay, parse, parseISO } from 'date-fns'
import { getDefaultCalendarOptions, getInitalSettings } from '@/util/baseInfo'
import { CALENDAR_VIEWS, SHOW_DATE_FORMAT } from '@/util/constants'
import { genSchedule, modifyTimeInfo } from '@/util/schedule'
import ModifySchedule, { IScheduleValue } from '@/components/ModifySchedule'
import Sidebar from '@/components/Sidebar'
import dayjs from 'dayjs'
import { getPageData, moveBlockToNewPage, moveBlockToSpecificBlock, updateBlock } from '@/util/logseq'
import { Button, Modal, Radio, Select, Tooltip } from 'antd'
import { LeftOutlined, RightOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons'
import Weekly from '@/components/Weekly'
import classNames from 'classnames'
import { ICustomCalendar, ISettingsForm } from '@/util/type'
import { useAtom } from 'jotai'

import { schedulesAtom } from '@/model/schedule'

const CalendarCom: React.FC<{
  schedules: ISchedule[]
  isProjectCalendar: boolean
}> = ({ schedules, isProjectCalendar = true }) => {
  // const [schedules] = useAtom(schedulesAtom)

  const { calendarList, subscriptionList, logKey } = getInitalSettings()

  const [showDate, setShowDate] = useState<string>()
  const [isFold, setIsFold] = useState(true)
  const [currentView, setCurrentView] = useState(logseq.settings?.defaultView || 'month')
  const enabledCalendarList: ICustomCalendar[] = (logKey?.enabled ? [logKey] : []).concat((calendarList as ICustomCalendar[])?.filter(calendar => calendar?.enabled))
  const enabledSubscriptionList: ICustomCalendar[] = subscriptionList ? subscriptionList?.filter(subscription => subscription?.enabled) : []
  const [modifyScheduleModal, setModifyScheduleModal] = useState<{
    visible: boolean
    type?: 'create' | 'update'
    values?: IScheduleValue
  }>({
    visible: false,
    type: 'create',
  })
  const [showExportWeekly, setShowExportWeekly] = useState<boolean>(Boolean(logseq.settings?.logKey?.enabled) && logseq.settings?.defaultView === 'week')
  const [weeklyModal, setWeeklyModal] = useState<{
    visible: boolean
    start?: string
    end?: string
  }>({ visible: false })

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
    setShowExportWeekly(logseq.settings?.logKey?.enabled && value === 'week')
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
  const onClickExportWeekly = async () => {
    const [start, end] = showDate?.split(' ~ ') || []
    setWeeklyModal({
      visible: true,
      start,
      end,
    })
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
      const calendarOptions = await getDefaultCalendarOptions()
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
              const logKey: ISettingsForm['logKey'] = logseq.settings?.logKey
              const newBlock = logKey?.enabled ? await moveBlockToSpecificBlock(schedule.raw?.id, journalName, `[[${logKey?.id}]]`) : await moveBlockToNewPage(schedule.raw?.id, journalName)
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
    })
    // setTimeout(() => {
    // }, 0)
  }, [])

  return (
    <div className="flex flex-col w-full h-full">
      {/* ========= title bar start ========= */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center">
          { !isProjectCalendar && (<Button className="mr-2" onClick={toggleFold} icon={isFold ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} />) }

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
          { showExportWeekly && <Button className="mr-4" onClick={onClickExportWeekly}>Export Weekly</Button> }
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

      <Weekly
        visible={weeklyModal.visible}
        start={weeklyModal.start}
        end={weeklyModal.end}
        onCancel={() => setWeeklyModal({ visible: false })}
      />
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

import { useEffect, useMemo, useRef, useState } from 'react'
import Calendar, { ISchedule } from 'tui-calendar'
import { Button, Modal, Select, Tooltip } from 'antd'
import { LeftOutlined, RightOutlined, SettingOutlined, ReloadOutlined, FullscreenOutlined, FullscreenExitOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons'
import { format, isSameDay, parse, parseISO } from 'date-fns'
import { listenEsc, managePluginTheme } from './util/util'
import Settings from './components/Settings'
import Weekly from './components/Weekly'
import { SHOW_DATE_FORMAT, CALENDAR_VIEWS } from './util/constants'
import ModifySchedule from './components/ModifySchedule'
import type { IScheduleValue } from './components/ModifySchedule'
import dayjs, { Dayjs } from 'dayjs'
import { genSchedule, getSchedules, modifyTimeInfo } from './util/schedule'
import { ICustomCalendar, ISettingsForm } from './util/type'
import { moveBlockToNewPage, updateBlock } from './util/logseq'
import { getDefaultCalendarOptions, getInitalSettings } from './util/baseInfo'
import 'tui-calendar/dist/tui-calendar.css'
import './App.css'
import { getSubCalendarSchedules } from './util/subscription'
import Sidebar from './components/Sidebar'

const App: React.FC<{ env: string }> = ({ env }) => {

  const calendarOptions = getDefaultCalendarOptions()

  const { calendarList, subscriptionList, logKey } = getInitalSettings()
  const enabledCalendarList: ICustomCalendar[] = (logKey?.enabled ? [logKey] : []).concat((calendarList as ICustomCalendar[])?.filter(calendar => calendar.enabled))
  const enabledSubscriptionList: ICustomCalendar[] = subscriptionList ? subscriptionList?.filter(subscription => subscription.enabled) : []

  const [isFullScreen, setIsFullScreen] = useState(false)
  const [isFold, setIsFold] = useState(true)
  const [currentView, setCurrentView] = useState(logseq.settings?.defaultView || 'month')
  const [showDate, setShowDate] = useState<string>()
  const [showExportWeekly, setShowExportWeekly] = useState<boolean>(Boolean(logseq.settings?.logKey?.enabled) && logseq.settings?.defaultView === 'week')
  const [weeklyModal, setWeeklyModal] = useState<{
    visible: boolean
    start?: string
    end?: string
  }>({ visible: false })
  const [settingModal, setSettingModal] = useState(false)
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
  const toggleFold = () => setIsFold(_isFold => !_isFold)
  const setSchedules = async () => {
    const calendar = calendarRef.current
    if (calendar) {
      calendar.clear()

      const schedules = await getSchedules()
      calendar.createSchedules(schedules)
      const { subscriptionList } = await getInitalSettings()
      const subscriptionSchedules = await getSubCalendarSchedules(subscriptionList)
      calendar.createSchedules(subscriptionSchedules)
      // calendar.createSchedules([{
      //   id: '1',
      //   calendarId: 'journal',
      //   title: 'Daily Log test',
      //   category: 'time',
      //   dueDateClass: '',
      //   start: '2022-03-14',
      //   end: '2022-03-15T00:00:00',
      //   isAllDay: true,
      //   body: 'Daily Log test detail\n123',
      //   bgColor: '#7ed3fd',
      //   color: '#222',
      //   borderColor: '#98dbfd',
      // }, {
      //   id: '1',
      //   calendarId: 'journal',
      //   title: 'Daily Log foo',
      //   category: 'time',
      //   dueDateClass: '',
      //   start: formatISO(new Date()),
      //   // isAllDay: true,
      //   body: 'Daily Log test detail\n123\n123\n123\n123\n123\n123\n123\n123\n123\n123\n123\n123\n123\n123\n123\n123\n123\n123\n123\n123\n123\n123\n123\n123\n123\n123\n123\n123\n123\n123\n123\n123\n123',
      //   bgColor: '#7ed3fd',
      //   color: '#333',
      //   borderColor: '#98dbfd',
      //   // customStyle: 'opacity: 0.6;',
      // }])

      // calendar.render()

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
  const onClickFullScreen = () => {
    setIsFullScreen(_isFullScreen => !_isFullScreen)
    calendarRef.current?.render()
  }
  const onSettingChange = (values: ISettingsForm) => {
    logseq.updateSettings({calendarList: 1, subscriptionList: 1})
    // ensure subscription list is array
    logseq.updateSettings({subscriptionList: [], ...values})
    if (values.weekStartDay !== logseq.settings?.weekStartDay) {
      calendarRef.current?.setOptions({
        week: {
          startDayOfWeek: values.weekStartDay,
        },
        month: {
          startDayOfWeek: values.weekStartDay,
        },
      })
    }
    setShowExportWeekly(Boolean(values.logKey?.enabled) && currentView === 'week')
    // if (values.logKey !== logseq.settings?.logKey) setSchedules()

    // exec after 500ms to make sure the settings are updated
    setTimeout(() => {
      managePluginTheme()
      setSchedules()
    }, 500)
    setSettingModal(false)
  }
  const onClickShowDate = async () => {
    if (currentView === 'day' && showDate) {
      const { preferredDateFormat } = await logseq.App.getUserConfigs()
      const date = format(parse(showDate, SHOW_DATE_FORMAT, new Date()), preferredDateFormat)
      logseq.App.pushState('page', { name: date })
      logseq.hideMainUI()
    }
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
            if (changes.start && !dayjs(changes.start).isSame(dayjs(String(schedule?.raw?.page?.journalDay), 'YYYYMMDD'), 'day')) {
              // if the start day is different from the original start day, then execute move operation
              console.log('[faiz:] === move journal schedule')
              const { preferredDateFormat } = await logseq.App.getUserConfigs()
              const journalName = format(dayjs(changes.start).valueOf(), preferredDateFormat)
              const newBlock = await moveBlockToNewPage(schedule.raw?.id, journalName, _content)
              console.log('[faiz:] === newBlock', newBlock, schedule, schedule?.id)
              if (newBlock) {
                calendarRef.current?.deleteSchedule(String(schedule.id), schedule.calendarId)
                calendarRef.current?.createSchedules([await genSchedule({
                  ...schedule,
                  blockData: newBlock,
                  calendarConfig: calendarList?.find(calendar => calendar.id === 'journal'),
                })])
                // calendarRef.current?.updateSchedule(schedule.id, schedule.calendarId, { raw: {
                //   ...newBlock,
                //   page: await logseq.Editor.getPage(newBlock.page?.id),
                // } })
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
  useEffect(() => {
    const callback = () => logseq.hideMainUI()
    listenEsc(callback)
    return () => {
      document.removeEventListener('keyup', callback)
    }
  }, [])

  return (
    <div className="w-screen h-screen flex items-center justify-center">
      <div className="mask w-screen h-screen fixed top-0 left-0 bg-black bg-opacity-50" onClick={() => logseq.hideMainUI()}></div>
      {/* ========= title bar start ========= */}
      <div className={`${isFullScreen ? 'w-full h-full' : 'w-5/6'} flex flex-col justify-center overflow-hidden bg-white relative rounded text-black p-3`} style={{ maxWidth: isFullScreen ? 'none' : '1200px' }}>
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center">
            <Button className="mr-2" onClick={toggleFold} icon={isFold ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} />
            <Select
              value={currentView}
              defaultValue={calendarOptions.defaultView}
              onChange={onViewChange}
              options={CALENDAR_VIEWS}
              style={{ width: '100px' }}
            />

            <Button className="ml-4" shape="round" onClick={onClickToday}>Today</Button>

            <Button className="ml-4" shape="circle" icon={<LeftOutlined />} onClick={onClickPrev}></Button>
            <Button className="ml-1" shape="circle" icon={<RightOutlined />} onClick={onClickNext}></Button>

            <Tooltip title={ currentView === 'day' ? 'Navigate to this journal note' : '' }>
              <span
                className={`ml-4 text-xl h-full items-center inline-block ${currentView === 'day' ? 'cursor-pointer' : 'cursor-auto'}`}
                style={{ height: '34px', lineHeight: '34px' }}
                onClick={onClickShowDate}
              >
                { showDate }
              </span>
            </Tooltip>
          </div>

          <div>
            { showExportWeekly && <Button className="mr-4" onClick={onClickExportWeekly}>Export Weekly</Button> }
            <Button className="mr-4" onClick={() => setSettingModal(true)} shape="circle" icon={<SettingOutlined />}></Button>
            <Button onClick={onClickFullScreen} shape="circle" icon={isFullScreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}></Button>
          </div>
        </div>
        {/* ========= title bar end ========= */}

        {/* ========= content start ========= */}
        <div className="flex flex-1">
          <div className={`transition-all overflow-hidden bg-gray-100 mr-2 ${isFold ? 'w-0 mr-0' : 'w-40'}`}>
            <Sidebar
              onShowCalendarChange={onShowCalendarChange}
              calendarList={enabledCalendarList}
              subscriptionList={enabledSubscriptionList}
            />
          </div>
          <div className="flex-1">
            <div id="calendar" style={{ height: isFullScreen ? '100%' : '624px' }}></div>
          </div>
        </div>
        {/* ========= content end ========= */}

        <Weekly
          visible={weeklyModal.visible}
          start={weeklyModal.start}
          end={weeklyModal.end}
          onCancel={() => setWeeklyModal({ visible: false })}
        />
        <Settings
          visible={settingModal}
          onCancel={() => setSettingModal(false)}
          onOk={onSettingChange}
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
    </div>
  )
}

export default App

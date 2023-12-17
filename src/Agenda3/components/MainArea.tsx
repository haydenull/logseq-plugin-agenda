import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import { Button, Segmented } from 'antd'
import dayjs from 'dayjs'
import { useAtom, useAtomValue } from 'jotai'
import { useRef, useState } from 'react'
import { FiSettings, FiXCircle } from 'react-icons/fi'
import { GoGoal } from 'react-icons/go'
import { LuCalendarDays, LuKanbanSquare } from 'react-icons/lu'

import { track } from '@/Agenda3/helpers/umami'
import { type App, appAtom } from '@/Agenda3/models/app'
import { settingsAtom } from '@/Agenda3/models/settings'
import i18n from '@/locales/i18n'
import { cn } from '@/util/util'

import Filter from './Filter'
import UploadIcs from './UploadIcs'
import Calendar, { type CalendarHandle } from './calendar/Calendar'
import CalendarOperation, { type CalendarView } from './calendar/CalendarAdvancedOperation'
import KanBan, { type KanBanHandle } from './kanban/KanBan'
import SettingsModal from './modals/SettingsModal'

const VIEWS = [
  {
    value: 'calendar',
    label: (
      <div className="flex items-center gap-1">
        <LuCalendarDays className="text-base" /> {i18n.t('Calendar')}
      </div>
    ),
  },
  {
    value: 'tasks',
    label: (
      <div className="flex items-center gap-1">
        <LuKanbanSquare className="text-base" /> {i18n.t('Tasks')}
      </div>
    ),
  },
]

const MultipleView = ({ className }: { className?: string }) => {
  const kanbanRef = useRef<KanBanHandle>(null)
  const calendarRef = useRef<CalendarHandle>(null)
  const [app, setApp] = useAtom(appAtom)
  const settings = useAtomValue(settingsAtom)

  const [calendarTitle, setCalendarTitle] = useState('')

  const onClickToday = () => {
    if (app.view === 'calendar') {
      calendarRef.current?.navToday()
    } else {
      kanbanRef.current?.scrollToToday()
    }
    track('Today Button', { view: app.view })
  }
  const onClickAppViewChange = (view) => {
    const _view = view as App['view']
    setApp((_app) => {
      const _sidebarType = _view === 'tasks' ? 'timebox' : 'backlog'
      return { ..._app, view: _view, sidebarType: _sidebarType }
    })
    track('View Change', { view: view })
  }
  const onClickGoal = () => {
    const type = calendarRef.current?.getView() === 'dayGridMonth' ? 'month' : 'week'
    const date = calendarRef.current?.getDate()
    const day = dayjs(date)
    setApp((_app) => ({
      ..._app,
      sidebarType: 'objective',
      objectivePeriod: {
        type,
        number: type === 'month' ? day.month() + 1 : day.isoWeek(),
        year: day.year(),
      },
    }))
  }

  return (
    <div className={cn('relative z-0 flex w-0 flex-1 flex-col py-1 pl-2', className)}>
      {/* ========= View Actions ========= */}
      <div className="flex w-full items-center justify-between border-b py-1 pr-2">
        <div className="flex items-center">
          {app.view === 'calendar' ? (
            <div className="mr-1">
              <Button
                icon={<LeftOutlined />}
                shape="circle"
                className="mr-1 !bg-transparent"
                onClick={() => {
                  calendarRef.current?.prev()
                  track('Calendar Previous Button')
                }}
              />
              <Button
                icon={<RightOutlined />}
                shape="circle"
                className="!bg-transparent"
                onClick={() => {
                  calendarRef.current?.next()
                  track('Calendar Next Button')
                }}
              />
            </div>
          ) : null}
          <Button className="!bg-transparent" shape="round" onClick={onClickToday}>
            Today
          </Button>
          {app.view === 'calendar' ? (
            <h1 className="ml-3 flex items-center gap-1 text-xl font-medium">
              {calendarTitle}
              {/* <div className="cursor-pointer text-gray-400 hover:text-gray-700" onClick={onClickGoal}>
                <GoGoal />
              </div> */}
            </h1>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          {app.view === 'calendar' ? (
            <CalendarOperation
              value={app.calendarView}
              onChange={(view) => {
                calendarRef.current?.changeView(view as CalendarView)
                setApp((_app) => ({ ..._app, calendarView: view }))
                track('Calendar View Change', { calendarView: view })
              }}
            />
          ) : null}
          <Segmented defaultValue={app.view} className="!bg-gray-200" options={VIEWS} onChange={onClickAppViewChange} />
          {settings.filters?.length ? <Filter /> : null}
          {settings.ics?.repo && settings.ics?.token ? <UploadIcs className="cursor-pointer text-lg" /> : null}
          <SettingsModal initialTab="general">
            <FiSettings className="cursor-pointer text-lg" onClick={() => track('Settings Button')} />
          </SettingsModal>
          {import.meta.env.VITE_MODE === 'plugin' ? (
            <FiXCircle className="cursor-pointer text-lg" onClick={() => logseq.hideMainUI()} />
          ) : null}
        </div>
      </div>
      <div className="h-0 flex-1">
        {app.view === 'tasks' ? (
          <KanBan ref={kanbanRef} />
        ) : (
          <Calendar ref={calendarRef} onCalendarTitleChange={setCalendarTitle} />
        )}
      </div>
    </div>
  )
}

export default MultipleView

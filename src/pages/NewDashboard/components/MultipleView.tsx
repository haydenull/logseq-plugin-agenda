import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import { Button, Segmented } from 'antd'
import { useAtom, useAtomValue } from 'jotai'
import { useRef, useState } from 'react'
import { FiSettings, FiXCircle } from 'react-icons/fi'
import { LuCalendarDays, LuKanbanSquare } from 'react-icons/lu'

import i18n from '@/locales/i18n'
import { track } from '@/newHelper/umami'
import { type App, appAtom } from '@/newModel/app'
import { settingsAtom } from '@/newModel/settings'
import { cn } from '@/util/util'

import Calendar, { type CalendarHandle } from './Calendar'
import CalendarOperation, { type CalendarView } from './CalendarOperation'
import Filter from './Filter'
import KanBan, { type KanBanHandle } from './KanBan'
import SettingsModal from './SettingsModal'
import UploadIcs from './UploadIcs'

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

  return (
    <div className={cn('flex flex-col pl-2 py-1 flex-1 w-0 z-0 relative', className)}>
      {/* ========= View Actions ========= */}
      <div className="border-b flex justify-between w-full py-1 items-center pr-2">
        <div className="flex items-center">
          {app.view === 'calendar' ? (
            <div className="mr-1">
              {/* <Segmented
                options={[
                  { value: 'dayGridMonth', label: 'Month' },
                  // { value: 'dayGridWeek', label: '2 Weeks' },
                  { value: 'timeGridWeek', label: 'Week' },
                ]}
                className="!bg-gray-200 !mr-3"
                onChange={(view) => {
                  calendarRef.current?.changeView(view as CalendarView)
                  track('Calendar View Change', { calendarView: view })
                }}
              /> */}
              <Button
                icon={<LeftOutlined />}
                shape="circle"
                className="!bg-transparent mr-1"
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
          {app.view === 'calendar' ? <h1 className="ml-3 font-medium text-xl">{calendarTitle}</h1> : null}
        </div>
        <div className="flex items-center gap-3">
          {/* <Tabs
            activeKey={app.view}
            items={VIEWS}
            onChange={(key) => {
              setApp((_app) => ({ ..._app, view: key as App['view'] }))
              track('View Change', { view: key })
            }}
            // renderTabBar={(props, DefaultTabBar) => <DefaultTabBar />}
            tabBarStyle={{ height: '36px', margin: 0 }}
          /> */}
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
          <Segmented
            defaultValue={app.view}
            className="!bg-gray-200"
            options={VIEWS}
            onChange={(view) => {
              setApp((_app) => ({ ..._app, view: view as App['view'] }))
              track('View Change', { view: view })
            }}
          />
          {settings.filters?.length ? <Filter /> : null}
          {settings.ics?.repo && settings.ics?.token ? <UploadIcs className="text-lg cursor-pointer" /> : null}
          <SettingsModal initialTab="general">
            <FiSettings className="text-lg cursor-pointer" onClick={() => track('Settings Button')} />
          </SettingsModal>
          {import.meta.env.VITE_MODE === 'plugin' ? (
            <FiXCircle className="text-lg cursor-pointer" onClick={() => logseq.hideMainUI()} />
          ) : null}
        </div>
      </div>
      <div className="flex-1 h-0">
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

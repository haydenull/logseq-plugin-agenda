import { LeftOutlined, RightOutlined, SettingOutlined, UserOutlined } from '@ant-design/icons'
import { Avatar, Button, Segmented, Tabs } from 'antd'
import { useAtom, useAtomValue } from 'jotai'
import { useRef, useState } from 'react'
import { AiOutlineLeft, AiOutlineRight } from 'react-icons/ai'
import { FiPower, FiSettings, FiX, FiXCircle } from 'react-icons/fi'
import { LuCalendarDays, LuKanbanSquare } from 'react-icons/lu'

import i18n from '@/locales/i18n'
import { track } from '@/newHelper/umami'
import { type App, appAtom } from '@/newModel/app'
import { settingsAtom } from '@/newModel/settings'
import { cn } from '@/util/util'

import Calendar, { type CalendarView, type CalendarHandle } from './Calendar'
import Filter from './Filter'
import KanBan, { type KanBanHandle } from './KanBan'
import SettingsModal from './SettingsModal'
import UploadIcs from './UploadIcs'

const VIEWS = [
  {
    key: 'tasks',
    label: (
      <div className="flex items-center gap-1 h-[36px]">
        <LuKanbanSquare className="text-lg" /> {i18n.t('Tasks')}
      </div>
    ),
  },
  {
    key: 'calendar',
    label: (
      <div className="flex items-center gap-1 h-[36px]">
        <LuCalendarDays className="text-lg" /> {i18n.t('Calendar')}
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
              <Segmented
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
              />
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
        <div className="flex items-center gap-6">
          <Tabs
            activeKey={app.view}
            items={VIEWS}
            onChange={(key) => {
              setApp((_app) => ({ ..._app, view: key as App['view'] }))
              track('View Change', { view: key })
            }}
            // renderTabBar={(props, DefaultTabBar) => <DefaultTabBar />}
            tabBarStyle={{ height: '36px', margin: 0 }}
            // fix windows tabs 闪烁问题
            className="min-w-[166px]"
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
      {/* folded option bar */}
      <div className="w-[16px] h-full absolute right-0 top-0 flex items-center z-10 opacity-0 hover:opacity-100 transition-opacity">
        <div
          className="bg-[#f0f0f0] h-[50px] w-full rounded-tl rounded-bl flex items-center text-gray-400 hover:bg-gray-200 cursor-pointer border-l border-t border-b"
          onClick={() => setApp((_app) => ({ ..._app, rightSidebarFolded: !_app.rightSidebarFolded }))}
        >
          {app.rightSidebarFolded ? <AiOutlineLeft /> : <AiOutlineRight />}
        </div>
      </div>
    </div>
  )
}

export default MultipleView

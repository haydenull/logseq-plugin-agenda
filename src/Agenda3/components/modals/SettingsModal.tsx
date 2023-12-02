import { CopyOutlined, QuestionCircleOutlined, QuestionOutlined } from '@ant-design/icons'
import { Button, Checkbox, Input, Menu, Modal, Tooltip, Typography, message } from 'antd'
import type { MenuProps } from 'antd'
import copy from 'copy-to-clipboard'
import { useState } from 'react'
import { RiDeleteBin4Line, RiEdit2Line } from 'react-icons/ri'

import useSettings from '@/Agenda3/hooks/useSettings'
import type { Filter } from '@/Agenda3/models/settings'
import logo from '@/assets/logo.png'
import { cn } from '@/util/util'

import EditFilterModal from './EditFilterModal'
import s from './settingsModal.module.less'

// type MenuItem = Required<MenuProps>['items'][number]
// const menuItems: MenuItem[] = [
//   {
//     type: 'group',
//     label: 'App Settings',
//     children: [
//       {
//         label: 'ics',
//         key: 'ics',
//         // onClick: () => {},
//       },
//     ],
//   },
// ]
const tabs = [
  {
    key: 'general',
    label: 'General Settings',
  },
  {
    key: 'viewOptions',
    label: 'View Options',
  },
  {
    key: 'filters',
    label: 'Filters',
  },
  {
    key: 'shareAgenda',
    label: 'Share Agenda',
  },
  {
    key: 'about',
    label: 'About',
  },
] as const
type Tab = (typeof tabs)[number]['key']
const defaultTab = 'general'
const SettingsModal = ({ children, initialTab }: { children?: React.ReactNode; initialTab?: Tab }) => {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>()
  const { settings, setSettings } = useSettings()
  const finalActiveTab = activeTab ? activeTab : initialTab ?? defaultTab

  const icsUrl = `https://agenda-ics.haydenhayden.com?repo=${settings.ics?.repo}&token=${settings.ics?.token}`

  const onChange = (key: string, value: string | boolean | undefined | Filter[] | string[]) => {
    setSettings(key, value)
  }
  const onClickCopyIcsUrl = () => {
    copy(icsUrl)
    message.success('🎉 Copied!')
  }

  const onClickLink = (link: string) => {
    if (import.meta.env.VITE_MODE === 'plugin') {
      logseq.App.openExternalLink(link)
    } else {
      window.open(link, '_blank')
    }
    return false
  }

  const renderForm = () => {
    const oldFilters = settings.filters ?? []
    const oldSelectedFilters = settings.selectedFilters ?? []
    switch (finalActiveTab) {
      case 'shareAgenda':
        return (
          <>
            <div className="h-14 pl-4 flex items-center font-semibold text-lg border-b">ICS File Setting</div>
            <div className="px-4 mt-4 pb-8">
              <div className="mt-4">
                <div className="text-gray-500">Github Repo</div>
                <Input
                  className="w-[300px]"
                  placeholder="username/repo"
                  value={settings.ics?.repo}
                  onChange={(e) => onChange('ics.repo', e.target.value?.trim())}
                />
              </div>
              <div className="mt-4">
                <div className="text-gray-500">Github Access Token</div>
                <Input.Password
                  className="w-[300px]"
                  placeholder="github access token"
                  value={settings.ics?.token}
                  onChange={(e) => onChange('ics.token', e.target.value?.trim())}
                />
              </div>
              {settings.ics?.repo && settings.ics?.token ? (
                <div className="mt-4">
                  <div className="text-gray-500">
                    Public URL To Your Agenda{' '}
                    <Tooltip title="Use this url to access your agenda from other applications">
                      <QuestionCircleOutlined />{' '}
                    </Tooltip>
                  </div>
                  <Input.Password
                    value={icsUrl}
                    className="w-[300px]"
                    addonAfter={<CopyOutlined onClick={onClickCopyIcsUrl} />}
                  />
                </div>
              ) : null}
            </div>
          </>
        )
      case 'viewOptions':
        return (
          <>
            <div className="h-14 pl-4 flex items-center font-semibold text-lg border-b">View Options</div>
            <div className="px-4 mt-4 pb-8">
              <div className="mt-4 flex flex-col gap-1">
                <Checkbox
                  checked={settings.viewOptions?.showFirstEventInCycleOnly}
                  onChange={(e) => onChange('viewOptions.showFirstEventInCycleOnly', e.target.checked)}
                >
                  Only Show First Event In Cycle
                </Checkbox>
                <Checkbox
                  checked={settings.viewOptions?.showTimeLog}
                  onChange={(e) => onChange('viewOptions.showTimeLog', e.target.checked)}
                >
                  Show Time Log
                </Checkbox>
              </div>
              <div className="mt-4">
                <div className="text-gray-500">Calendar</div>
                <Checkbox
                  checked={settings.viewOptions?.hideCompleted}
                  onChange={(e) => onChange('viewOptions.hideCompleted', e.target.checked)}
                >
                  Hide Completed Tasks
                </Checkbox>
              </div>
            </div>
          </>
        )
      case 'general':
        return (
          <>
            <div className="h-14 pl-4 flex items-center font-semibold text-lg border-b">General Settings</div>
            <div className="px-4 mt-4 pb-8">
              <div className="mt-4 flex flex-col gap-1">
                <Checkbox
                  checked={settings.general?.useJournalDayAsSchedule}
                  onChange={(e) => onChange('general.useJournalDayAsSchedule', e.target.checked)}
                >
                  <Tooltip title="When the task in the journal is not scheduled, use the date of the journal as the task date.">
                    Use Journal Day As Schedule
                  </Tooltip>
                </Checkbox>
              </div>
            </div>
          </>
        )
      case 'filters':
        return (
          <>
            <div className="h-14 pl-4 flex items-center font-semibold text-lg border-b">Filters</div>
            <div className="px-4 mt-4 pb-8">
              <div className="mt-4 flex flex-col gap-1">
                <EditFilterModal type="create" onOk={(filter) => onChange('filters', oldFilters.concat(filter))}>
                  <Button>Create Filter</Button>
                </EditFilterModal>
                <div className="mt-4 flex flex-col gap-2">
                  {settings.filters?.map((filter) => (
                    <div
                      key={filter.id}
                      className="flex items-center justify-between w-[300px] border rounded px-4 py-1.5 text-white"
                      style={{ backgroundColor: filter.color }}
                    >
                      <span>{filter.name}</span>
                      <div className="flex gap-3">
                        <EditFilterModal
                          type="edit"
                          key={filter.id}
                          initialValues={filter}
                          onOk={(newFilter) =>
                            onChange(
                              'filters',
                              oldFilters.map((f) => (f.id === filter.id ? newFilter : f)),
                            )
                          }
                        >
                          <RiEdit2Line className="cursor-pointer" />
                        </EditFilterModal>
                        <RiDeleteBin4Line
                          className="cursor-pointer "
                          onClick={() => {
                            onChange(
                              'filters',
                              oldFilters.filter((f) => f.id !== filter.id),
                            )
                            onChange(
                              'selectedFilters',
                              oldSelectedFilters.filter((id) => id !== filter.id),
                            )
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )
      case 'about':
        return (
          <>
            <div className="h-14 pl-4 flex items-center font-semibold text-lg border-b">About</div>
            <div className="flex flex-col justify-center items-center pb-6">
              <img src={logo} className="w-20 mt-6" />
              <h1 className="text-xl">Agenda</h1>
              <div className="text-gray-400">version: v{__APP_VERSION__}</div>
              <div className="flex divide-x">
                <a
                  className="pr-2"
                  onClick={() => onClickLink('https://haydenut.notion.site/Agenda3-ef115e277c864de3b2679d6bda0e6376')}
                >
                  User Manual
                </a>
                <a className="pl-2" onClick={() => onClickLink('https://github.com/haydenull/logseq-plugin-agenda')}>
                  Github Repo
                </a>
              </div>
              <div className="text-xs text-gray-400 w-96">
                Please note that the beta version is still under development and may contain bugs. We encourage you to
                test it out and provide feedback on any issues or suggestions on our GitHub page. Your input is valuable
                in ensuring a stable and polished final release.
              </div>
              <div className="mt-2 flex flex-col gap-2">
                <a className="w-[190px]" onClick={() => onClickLink('https://www.buymeacoffee.com/haydenull')}>
                  <img src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=&slug=haydenull&button_colour=40DCA5&font_colour=ffffff&font_family=Cookie&outline_colour=000000&coffee_colour=FFDD00" />
                </a>
                <a
                  className="w-[190px] bg-[#946ce6] flex items-center justify-center rounded-lg"
                  onClick={() => onClickLink('https://afdian.net/a/haydenull')}
                >
                  <img width="156" src="https://pic1.afdiancdn.com/static/img/welcome/button-sponsorme.jpg" alt="" />
                </a>
              </div>
            </div>
          </>
        )
    }
  }

  return (
    <>
      <span onClick={() => setOpen(true)}>{children}</span>
      <Modal open={open} footer={null} width={900} onCancel={() => setOpen(false)} wrapClassName={s.modalWrapper}>
        <div className="flex">
          {/* sidebar */}
          <div className="w-[300px] bg-gray-100 px-4 py-4">
            <div className="font-semibold">APP SETTINGS</div>
            {tabs.map((tab) => (
              <div
                key={tab.key}
                className={cn('cursor-pointer hover:bg-gray-200 rounded p-2 mt-1', {
                  'bg-gray-200': tab.key === finalActiveTab,
                })}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </div>
            ))}
          </div>
          {/* content */}
          <div className="flex-1">{renderForm()}</div>
        </div>
      </Modal>
    </>
  )
}

export default SettingsModal

import { CopyOutlined, QuestionCircleOutlined, QuestionOutlined } from '@ant-design/icons'
import { Checkbox, Input, Menu, Modal, Tooltip, Typography, message } from 'antd'
import type { MenuProps } from 'antd'
import copy from 'copy-to-clipboard'
import { useState } from 'react'

import useSettings from '@/hooks/useSettings'
import { cn } from '@/util/util'

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
    key: 'viewOptions',
    label: 'View Options',
  },
  {
    key: 'shareAgenda',
    label: 'Share Agenda',
  },
] as const
const SettingsModal = ({ children }: { children?: React.ReactNode }) => {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]['key']>('viewOptions')
  const { settings, setSettings } = useSettings()

  const icsUrl = `https://agenda-ics.haydenhayden.com?repo=${settings.ics?.repo}&token=${settings.ics?.token}`

  const onChange = (key: string, value: string | boolean | undefined) => {
    setSettings(key, value)
  }
  const onClickCopyIcsUrl = () => {
    copy(icsUrl)
    message.success('🎉 Copied!')
  }

  const renderForm = () => {
    switch (activeTab) {
      case 'shareAgenda':
        return (
          <>
            <div className="h-14 pl-4 flex items-center font-semibold text-lg border-b">ICS File Setting</div>
            <div className="px-4 mt-4 pb-8">
              <div className="mt-4">
                <div className="text-gray-500">Github Repo</div>
                <Input
                  className="w-[300px]"
                  value={settings.ics?.repo}
                  onChange={(e) => onChange('ics.repo', e.target.value)}
                />
              </div>
              <div className="mt-4">
                <div className="text-gray-500">Github Access Token</div>
                <Input.Password
                  className="w-[300px]"
                  value={settings.ics?.token}
                  onChange={(e) => onChange('ics.token', e.target.value)}
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
              <div className="mt-4">
                <Checkbox
                  checked={settings.viewOptions?.showFirstEventInCycleOnly}
                  onChange={(e) => onChange('viewOptions.showFirstEventInCycleOnly', e.target.checked)}
                >
                  Only Show First Event In Cycle
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
                  'bg-gray-200': tab.key === activeTab,
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

import { Modal } from 'antd'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/util/util'

import About from './About'
import FiltersForm from './FiltersForm'
import GeneralSettingsForm from './GeneralSettingsForm'
import ShareAgendaForm from './ShareAgendaForm'
import ViewOptionsForm from './ViewOptionsForm'
import s from './index.module.less'

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
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>()
  const finalActiveTab = activeTab ? activeTab : initialTab ?? defaultTab

  const translatedTabs = tabs.map((tab) => ({
    ...tab,
    label: t(tab.label),
  }))

  const renderForm = () => {
    switch (finalActiveTab) {
      case 'shareAgenda':
        return <ShareAgendaForm />
      case 'viewOptions':
        return <ViewOptionsForm />
      case 'general':
        return <GeneralSettingsForm />
      case 'filters':
        return <FiltersForm />
      case 'about':
        return <About />
    }
  }

  return (
    <>
      <span onClick={() => setOpen(true)}>{children}</span>
      <Modal open={open} footer={null} width={900} onCancel={() => setOpen(false)} wrapClassName={s.modalWrapper}>
        <div className="flex">
          {/* sidebar */}
          <div className="w-[300px] bg-gray-100 px-4 py-4">
            <div className="font-semibold uppercase">{t('app settings')}</div>
            {translatedTabs.map((tab) => (
              <div
                key={tab.key}
                className={cn('mt-1 cursor-pointer rounded p-2 hover:bg-gray-200', {
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

import classNames from 'classnames'
import React, { useState } from 'react'

import Tabs from '@/pages/Settings/components/Tabs'
import s from './index.module.less'
import ChronoView from './components/Chrono'
import { AnimatePresence, motion } from 'framer-motion'
import { DatePicker } from 'antd'

const TABS = [
  { value: 'chrono', label: 'Chrono View' },
  { value: 'calendar', label: 'Calendar View' },
]

const Journal = () => {
  const [tab, setTab] = useState(TABS[0].value)

  return (
    <div className="page-container p-8 flex flex-col items-center">
      <h1 className={classNames(s.title, 'title-text w-full')}>Journal</h1>
      <div className={classNames(s.content, 'bg-quaternary rounded-2xl flex w-full h-full p-8')}>
        <div className="flex flex-col justify-between">
          <Tabs value={tab} tabs={TABS} onChange={setTab} />
        </div>

        <div className="w-full h-full relative">
          <AnimatePresence>
            {tab === 'chrono' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ ease: 'easeInOut', duration: 0.2 }}
                className="w-full h-full"
              >
                <ChronoView />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

export default Journal

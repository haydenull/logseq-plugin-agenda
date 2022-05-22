import Gantt from '@/packages/Gantt'
import { IGroup } from '@/packages/Gantt/type'
import classNames from 'classnames'
import React, { useState } from 'react'
import { motion, AnimatePresence  } from 'framer-motion'
import { IoIosArrowUp, IoIosArrowDown} from 'react-icons/io'

import s from '../index.module.less'
import useTheme from '@/hooks/useTheme'
import { getPageData } from '@/util/logseq'
import dayjs from 'dayjs'
import { ISchedule } from 'tui-calendar'

const Timeline: React.FC<{
  project: IGroup
}> = ({ project }) => {
  const [expand, setExpand] = useState(true)
  const theme = useTheme()


  // const projectWidthPopup = {
  //   ...project,
  //   events: project.events.map(event => 
  // }

  return (
    <div className={classNames(s.timelineWrapper, {[s.expand]: expand}, 'rounded-2xl mb-9 h-auto p-6 shadow')}>
      <h3 className="title-text flex items-center cursor-pointer" onClick={() => setExpand(_expand => !_expand)}>
        {project.title}
        {expand ? <IoIosArrowUp className="ml-2" /> : <IoIosArrowDown className="ml-2" />}
      </h3>
      <AnimatePresence>
        {expand && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: '60vh' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ ease: 'easeInOut', duration: 0.2 }}
          >
            <Gantt
              data={[project]}
              weekStartDay={logseq.settings?.weekStartDay || 0}
              theme={theme}
              defaultMode="advanced"
              uniqueId={project.id}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Timeline

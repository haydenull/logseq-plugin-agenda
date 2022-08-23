import Gantt from '@/packages/Gantt'
import { IGroup } from '@/packages/Gantt/type'
import classNames from 'classnames'
import React, { useState } from 'react'
import { motion, AnimatePresence  } from 'framer-motion'
import { IoIosArrowUp, IoIosArrowDown} from 'react-icons/io'

import s from '../index.module.less'
import useTheme from '@/hooks/useTheme'
import { genRandomString } from '@/util/util'

const Timeline: React.FC<{
  projects: IGroup[]
}> = ({ projects }) => {
  const [expand, setExpand] = useState(true)
  const theme = useTheme()

  return (
    <div className={classNames(s.timelineWrapper, {[s.expand]: expand}, 'rounded-2xl mb-9 h-auto p-6 shadow')}>
      <AnimatePresence>
        {expand && (
          <motion.div
            className="overflow-hidden"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ ease: 'easeInOut', duration: 0.2 }}
          >
            <Gantt
              data={projects}
              weekStartDay={logseq.settings?.weekStartDay || 0}
              theme={theme}
              uniqueId={genRandomString()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Timeline

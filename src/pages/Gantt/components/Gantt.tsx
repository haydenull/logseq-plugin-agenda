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

export const getGanttDetailPopup = (schedule: ISchedule) => {
  const { raw = {}, start, end, id = '', title = '' } = schedule
  const dayjsStart = dayjs(start as string)
  const dayjsEnd = dayjs(end as string)

  return  (
    <div className="text-xs">
      <div className="font-bold text-base my-2">{title}</div>
      <div className="my-2">{`${dayjsStart.format('YYYY.MM.DD hh:mm a')} - ${dayjsEnd.format('hh:mm a')}`}</div>
      <p className="whitespace-pre-line">{raw.content}</p>

      <a onClick={async () => {
        const rawData: any = raw
        const { id: pageId, originalName } = rawData?.page || {}
        let pageName = originalName
        // datascriptQuery 查询出的 block, 没有详细的 page 属性, 需要手动查询
        if (!pageName) {
          const page = await getPageData({ id: pageId })
          pageName = page?.originalName
        }
        const { uuid: blockUuid } = await logseq.Editor.getBlock(rawData.id) || { uuid: '' }
        logseq.Editor.scrollToBlockInPage(pageName, blockUuid)
        logseq.hideMainUI()
      }}>Navigate to block</a>
    </div>
  )
}

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

import React, { useState } from 'react'
import { IEvent, IGroup } from '@/packages/Gantt/type'
import { IoIosArrowUp, IoIosArrowDown} from 'react-icons/io'
import { motion, AnimatePresence  } from 'framer-motion'
import classNames from 'classnames'
import dayjs from 'dayjs'
import Gantt from '@/packages/Gantt'
import useTheme from '@/hooks/useTheme'
import GaugeChart from '@/components/GaugeChart'

import s from '../index.module.less'
import { getPageData } from '@/util/logseq'

function getNearestMilestone(data: IGroup) {
  const { milestones = [] } = data
  if (milestones?.length === 0) return null
  const futureMilestones = milestones.filter(item => dayjs(item.start).isSameOrAfter(dayjs(), 'day'))
  if (futureMilestones.length === 0) return null
  return futureMilestones.sort((a, b) => {
    return dayjs(a.start).diff(dayjs(b.start))
  })?.[0]

}

const Project: React.FC<{
  data: IGroup
}> = ({ data }) => {
  const [expand, setExpand] = useState(false)
  const theme = useTheme()

  const milestone = getNearestMilestone(data)

  const doingCount = data?.amount?.doing || 0
  const todoCount = data?.amount?.todo || 0
  const doneCount = data?.amount?.done || 0
  const totalCount = doingCount + todoCount + doneCount
  const progress = totalCount === 0 ? 0 : (doneCount / totalCount)

  const onClickMilestone = async (milestone: IEvent) => {
    console.log('[faiz:] === milestone', milestone)
    const { raw = {}, start, end, id = '', title = '' } = milestone
    const rawData: any = raw?.blockData
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
  }
  const onClickProjectTitle = async () => {
    const pageName = data.id
    const pageData = await getPageData({ originalName: pageName })
    if (pageData?.properties?.agenda) {
      logseq.App.pushState('page', { name: pageData.originalName })
      logseq.hideMainUI()
    } else {
      logseq.App.showMsg('This is not an agenda project.', 'warning')
    }
  }

  return (
    <div className={classNames(s.project)}>
      <div className={classNames('flex flex-col flex-1 w-0', s.projectContent, { [s.expand]: expand })}>
        <div className="flex justify-between items-center h-24 p-3">
          <div className="h-full flex items-center cursor-pointer" onClick={onClickProjectTitle}>
            <div
              className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-lg font-medium"
              style={{backgroundColor: data?.style?.bgColor, color: data?.style?.color}}
            >{data.title?.[0]?.toUpperCase()}</div>
            <div className="ml-3">
              <div className="text-lg title-text">{data.title}</div>
              <div className="mt-1 description-text">
                {`doing: ${data?.amount?.doing || 0} todo: ${data?.amount?.todo || 0} done: ${data?.amount?.done || 0}`}
              </div>
            </div>
          </div>

          <div className="h-full flex items-center">
            <div style={{ width: '4.375rem' }}>
              <GaugeChart progress={parseInt('' + progress * 100)} uniqueId={data.id} height={70} type="normal" />
            </div>
            {
              milestone && (
                <div
                  className={classNames('flex flex-col items-center justify-center d h-full pl-3 pr-1 ml-3 cursor-pointer', s.milestone)}
                  onClick={() => onClickMilestone(milestone)}
                >
                  <div className="text-center">
                    <span className="text-3xl title-text">{dayjs(milestone.start).format('DD')}</span>
                    <span className="text-xs description-text ml-1">{dayjs(milestone.start).format('MMM')}</span>
                  </div>
                  <span className="text-xs description-text">days left: {dayjs(milestone.start).diff(dayjs(), 'day')}d</span>
                  <span className="text-xs description-text ellipsis w-full" title={milestone.title}>{milestone.title}</span>
                </div>
              )
            }
          </div>

        </div>

        <AnimatePresence>
          {expand && (
            <motion.div
              className={classNames(s.timeline, { [s.showTimeline]: expand })}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: '0.5rem', padding: '0.75rem' }}
              exit={{ opacity: 0, height: 0, marginTop: 0, padding: 0 }}
              transition={{ ease: 'easeInOut', duration: 0.2 }}
            >
              <Gantt data={[data]} weekStartDay={0} showOptions={false} showSidebar={false} defaultView="week" theme={theme} uniqueId={data?.id} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div
        className={classNames(s.option, 'text w-10 h-10 rounded-full flex justify-center items-center shadow-sm text-lg ml-3 cursor-pointer')}
        onClick={() => setExpand(!expand)}
      >
        <div className="flex items-center">{ expand ? <IoIosArrowUp /> : <IoIosArrowDown /> }</div>
      </div>
    </div>
  )
}

export default Project

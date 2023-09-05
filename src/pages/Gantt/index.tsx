import { Typography } from 'antd'
import classNames from 'classnames'
import { useAtom } from 'jotai'

import { ganttDataAtom } from '@/model/gantt'

import GanttCom from './components/Gantt'
import s from './index.module.less'

const Index = () => {
  const [ganttData] = useAtom(ganttDataAtom)
  const projectData = ganttData || []

  return (
    <div className="page-container p-8 flex flex-col">
      <Typography.Title className="title-text" level={3}>
        Gantt
      </Typography.Title>
      <div className={classNames(s.contentWrapper, 'shadow rounded-2xl')}>
        <GanttCom projects={projectData} />
      </div>
    </div>
  )
}

export default Index

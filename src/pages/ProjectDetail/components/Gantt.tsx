import Gantt from '@/packages/Gantt'
import { IGroup, IMode } from '@/packages/Gantt/type'
import classNames from 'classnames'
import { ganttDataAtom } from '@/model/gantt'

import s from '../index.module.less'
import useTheme from '@/hooks/useTheme'
import { getPageData } from '@/util/logseq'
import dayjs from 'dayjs'
import { ISchedule } from 'tui-calendar'
import { useAtom } from 'jotai'
import { genRandomString } from '@/util/util'

const Timeline: React.FC<{
  projectId: string
  mode: IMode
}> = ({ projectId, mode }) => {
  const [ganttData] = useAtom(ganttDataAtom)
  const project = ganttData?.find(item => item.id === projectId)
  const theme = useTheme()

  return project ? (
    <Gantt
      data={[project]}
      weekStartDay={logseq.settings?.weekStartDay || 0}
      theme={theme}
      defaultMode={mode}
      uniqueId={genRandomString()}
    />
  ) : null
}

export default Timeline

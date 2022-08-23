import Gantt from '@/packages/Gantt'
import { IGroup } from '@/packages/Gantt/type'
import classNames from 'classnames'

import s from '../index.module.less'
import useTheme from '@/hooks/useTheme'
import { genRandomString } from '@/util/util'

const Timeline: React.FC<{
  projects: IGroup[]
}> = ({ projects }) => {
  const theme = useTheme()

  return (
    <div className={classNames(s.timelineWrapper, 'h-full p-6')}>
      <Gantt
        data={projects}
        weekStartDay={logseq.settings?.weekStartDay || 0}
        theme={theme}
        uniqueId={genRandomString()}
      />
    </div>
  )
}

export default Timeline

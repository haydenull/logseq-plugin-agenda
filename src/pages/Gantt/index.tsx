import React, { useState } from 'react'
import Gantt from '@/packages/Gantt'
import classNames from 'classnames'
import { useAtom } from 'jotai'
import { ganttDataAtom } from '@/model/gantt'

import s from './index.module.less'

const index: React.FC<{}> = () => {
  const [ganttData] = useAtom(ganttDataAtom)

  return (
    <div className="page-container p-8 flex flex-col">
      <h1>Gantt</h1>
      <div className={classNames(s.contentWrapper)}>
        <Gantt data={ganttData ? ganttData : []} weekStartDay={logseq.settings?.weekStartDay || 0} />
      </div>
    </div>
  )
}

export default index

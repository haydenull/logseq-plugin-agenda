import React, { useState } from 'react'
import { IGroup } from '@/packages/Gantt/type'
import { IoIosArrowUp, IoIosArrowDown} from 'react-icons/io'

import s from '../index.module.less'
import classNames from 'classnames'

const Project: React.FC<{
  data: IGroup
}> = ({ data }) => {
  const [expand, setExpand] = useState(false)

  return (
    <div className={classNames(s.project)}>
      <div className="flex justify-between items-center h-24 ">
        <div className={s.projectContent}>
          <div>{data.title?.[0]?.toUpperCase()}</div>
          <div>{data.title}</div>
          <div>
            todo: 10 doing: 5 done: 5
          </div>
        </div>

        <div className={s.milestone}>
          <span>30</span>
          <span>Apr.</span>
          <span>left: 1d</span>
        </div>
        <div className={s.milestone}>
          <span>30</span>
          <span>Apr.</span>
          <span>left: 1d</span>
        </div>

        <div className={s.option}>
          { expand ? <IoIosArrowUp onClick={() => setExpand(false)} /> : <IoIosArrowDown onClick={() => setExpand(true)} /> }
        </div>
      </div>

      <div className={classNames(s.timeline, { [s.showTimeline]: expand })}>
        { expand && (
          <div>timeline</div>
        ) }
      </div>
    </div>
  )
}

export default Project

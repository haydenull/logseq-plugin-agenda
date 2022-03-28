import React, { useState } from 'react'
import Calendar from './components/Calendar'
import Group from './components/Group'
import './index.css'

const Gantt: React.FC<{
  [prop: string]: any
}> = ({ ...props }) => {
  return (
    <div className="w-full h-full overflow-auto">
      <div style={{ height: '300px' }}></div>
      {/* <div className="side-bar overflow-auto">
        <Group />
        <Group />
        <Group />
        <Group />
      </div> */}
      {/* <Calendar /> */}
    </div>
  )
}

export default Gantt

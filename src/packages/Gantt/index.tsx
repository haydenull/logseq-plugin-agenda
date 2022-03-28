import React, { useState } from 'react'
import Calendar from './components/Calendar'
import Group from './components/Group'
import './index.css'

const Gantt: React.FC<{
  [prop: string]: any
}> = ({ ...props }) => {
  return (
    <div className="container" {...props}>
      <div className="side-bar">
        <Group />
        <Group />
      </div>
      <Calendar />
    </div>
  )
}

export default Gantt

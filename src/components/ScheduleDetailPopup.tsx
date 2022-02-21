import React, { useState } from 'react'

const ScheduleDetailPopup: React.FC<{
  position: { x: number; y: number }
}> = ({ position }) => {
  return (
    <div className="fixed" style={{ left: position.x, top: position.y }}>12332131</div>
  )
}

export default ScheduleDetailPopup

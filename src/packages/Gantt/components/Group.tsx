import React, { useState } from 'react'

const Group: React.FC<{}> = () => {
  return (
    <div className="group">
      <div className="group__title">Group Title</div>
      <div className="group__content">
        <div className="group__event">event1</div>
        <div className="group__event">event1</div>
        <div className="group__event">event1</div>
        <div className="group__event">event1</div>
        <div className="group__event">event1</div>
      </div>
    </div>
  )
}

export default Group

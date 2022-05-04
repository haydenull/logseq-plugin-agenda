import classNames from 'classnames'
import React, { useState } from 'react'

import s from '../index.module.less'

const Tabs: React.FC<{
  value: string
  tabs: { value: string; label: string }[]
  onChange?: (value: string) => void
}> = ({ value, tabs, onChange }) => {
  const curVal = value
  return (
    <div className={s.tabs}>
      {
        tabs.map(({ value, label }) => (
          <div
            key={value}
            className={classNames(s.tab, { [s.active]: curVal === value })}
            onClick={() => onChange?.(value)}
          >
            {label}
          </div>
        ))
      }
    </div>
  )
}

export default Tabs

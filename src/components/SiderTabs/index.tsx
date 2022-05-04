import React, { useState } from 'react'

import s from './index.module.less'

const index: React.FC<{
  tabs: {label: string, value: string, icon: JSX.Element}[]
  onChange?: (value: string) => void
  initialValue?: string
}> = ({ initialValue, onChange, tabs }) => {
  const [curValue, setCurValue] = useState(initialValue || tabs?.[0]?.value)

  const indicatorY = tabs.findIndex(({ value }) => value === curValue) * 100

  const onClick = (value: string) => {
    setCurValue(value)
    onChange?.(value)
  }

  return (
    <div className={s.container}>
      {
        tabs.map(({ label, value, icon }) => {
          return (
            <div key={value} className={s.buttonWrapper} onClick={() => onClick(value)}>
              <div className={`${s.button} ${value === curValue ? s.active : ''}`} title={label}>{icon}</div>
            </div>
          )
        })
      }
      <div className={s.indicatorBack} style={{ transform: `translateX(60px) translateY(${indicatorY}%)` }}></div>
      <div className={s.indicatorDot} style={{ transform: `translateY(${indicatorY}%)` }}></div>
    </div>
  )
}

export default index

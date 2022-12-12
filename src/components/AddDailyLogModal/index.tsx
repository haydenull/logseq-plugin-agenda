import { Modal } from 'antd'
import React, { useEffect, useState } from 'react'
import AnyTouch, { AnyTouchEvent } from '@any-touch/core'
import pan from '@any-touch/pan'

import s from './index.module.less'

const AddDailyLogModal: React.FC<{
  visible: boolean
  onCancel: () => void
}> = ({ visible, onCancel }) => {
  const [panInfo, setPanInfo] = useState({ x: 0, distance: 0 })

  useEffect(() => {
    const el = document.querySelector('#time-ruler')
    const containerLeft = el?.getBoundingClientRect()?.left || 0
    console.log('[faiz:] === el?.getBoundingClientRect()', el?.getBoundingClientRect())
    const at = new AnyTouch(el, { preventDefault: false })
    at.use(pan, { threshold: 0 })
    at.on(['panstart', 'panleft', 'panright', 'panend'], (e: AnyTouchEvent) => {
      console.log('[faiz:] === pan', e)
      const { x, displacementX, isStart, isEnd, type, nativeEvent } = e;
      if (isStart || type === 'panstart') setPanInfo(info => ({ ...info, x: (nativeEvent as any).offsetX }))
      setPanInfo(info => ({ ...info, distance: displacementX }))
    })
    return () => {
      at.off('panstart')
      at.off('panleft')
      at.off('panright')
      at.off('panend')
    }
  }, [])

  return (
    <Modal
      open={visible}
      onCancel={onCancel}
    >
      <div id="time-ruler" className={s.container}>
        <div id="ruler-indicator" className={s.indicator} style={{ left: panInfo.x + 'px', width: panInfo.distance + 'px' }}></div>
      </div>
    </Modal>
  )
}

export default AddDailyLogModal
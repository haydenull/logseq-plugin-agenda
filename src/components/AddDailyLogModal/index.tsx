import { Button, DatePicker, Drawer, Form, Input, Modal, Space } from 'antd'
import React, { useEffect, useState } from 'react'
import AnyTouch, { AnyTouchEvent } from '@any-touch/core'
import pan from '@any-touch/pan'
import classNames from 'classnames'
import s from './index.module.less'

const TOTAL_HOURS_COUNT = 24

const AddDailyLogModal: React.FC<{
  visible: boolean
  onCancel: () => void
}> = ({ visible, onCancel }) => {
  const [panInfo, setPanInfo] = useState({ y: 0, distance: 0 })

  useEffect(() => {
    const el = document.querySelector('#time-ruler')
    const containerLeft = el?.getBoundingClientRect()?.left || 0
    console.log('[faiz:] === el?.getBoundingClientRect()', el?.getBoundingClientRect())
    const at = new AnyTouch(el, { preventDefault: false })
    at.use(pan, { threshold: 0 })
    at.on(['panstart', 'panup', 'pandown', 'panend'], (e: AnyTouchEvent) => {
      console.log('[faiz:] === pan', e)
      const { y, displacementY, isStart, isEnd, type, nativeEvent } = e;
      if (isStart || type === 'panstart') setPanInfo(info => ({ ...info, y: (nativeEvent as any).offsetY }))
      setPanInfo(info => ({ ...info, distance: displacementY }))
    })
    return () => {
      at.off('panstart')
      at.off('panup')
      at.off('pandown')
      at.off('panend')
    }
  }, [])

  return (
    <Drawer
      title="Add a log"
      width={400}
      open={visible}
      onClose={onCancel}
      placement="left"
      extra={
        <Space>
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="primary">Add</Button>
        </Space>
      }
    >
      <div className="flex flex-col h-full">
        <Form labelCol={{ span: 5 }}>
          <Form.Item label="Date">
            <DatePicker className="w-full" style={{ marginBottom: '12px' }} />
          </Form.Item>
          <Form.Item label="Content">
            <Input />
          </Form.Item>
        </Form>
        <div className="mt-3 flex flex-row">
          {/*======= time ruler selector start ====== */}
          <div
            id="time-ruler"
            className={classNames(s.rulerContainer, 'bg-primary relative rounded cursor-pointer select-none ml-10 description-text')}
            style={{ minHeight: 50 * TOTAL_HOURS_COUNT + 'px' }}
          >
            <div className={classNames(s.mark, 'flex flex-col justify-between h-full')}>
              {
                [...new Array(TOTAL_HOURS_COUNT + 1).keys()].map((_, index) => {
                  const isHeadOrTail = index === 0 || index === TOTAL_HOURS_COUNT
                  const showText = index < 10 ? '0' + index : index
                  return <div><span>{isHeadOrTail ? '' : showText + ':00' }</span></div>
                })
              }
            </div>
            <div
              id="ruler-indicator"
              className={classNames(s.indicator, 'absolute top-0 box-border w-full rounded opacity-50 font-bold', panInfo.distance > 0 ? 'visible' : 'hidden')}
              style={{ top: panInfo.y + 'px', height: panInfo.distance + 'px' }}
            >
              <span className="absolute bottom-0 left-1">10:00-16:00</span>
            </div>
          </div>
          {/*======= time ruler selector end ====== */}
          {/*======= tag selector start ====== */}
          <div>

          </div>
          {/*======= tag selector end ====== */}
        </div>
      </div>
    </Drawer>
  )
}

export default AddDailyLogModal
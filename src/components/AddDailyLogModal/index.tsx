import { getInitialSettings } from '@/util/baseInfo'
import { createBlockToSpecificBlock } from '@/util/logseq'
import AnyTouch, { AnyTouchEvent } from '@any-touch/core'
import pan from '@any-touch/pan'
import { Button, DatePicker, Drawer, Form, Input, Space } from 'antd'
import classNames from 'classnames'
import format from 'date-fns/format'
import dayjs from 'dayjs'
import React, { useEffect, useState } from 'react'
import s from './index.module.less'
import TagSelector from './TagSelector'

// const TAG_LIST_DEMO = [
//   {
//     id: '111adssdahfkdfhashfdjhfjasdhfjah',
//     bgColor: '#047857',
//     textColor: '#fff',
//     borderColor: '#047857',
//   },
//   {
//     id: '222',
//     bgColor: '#047857',
//     textColor: '#fff',
//     borderColor: '#047857',
//   },
// ]

/** 时间轴一个小时对应的高度 */
const HOUR_HEIGHT = 50
/** 时间轴单位刻度对应的时长 */
const SCALE_INTERVAL_TIME_LENGTH = 15
/** 时间轴单位刻度对应的高度 */
const SCALE_INTERVAL = HOUR_HEIGHT / (60 / SCALE_INTERVAL_TIME_LENGTH)

const getNearestAvaliableScalePosition = (truelyPosition: number) => {
  return Math.round(truelyPosition / SCALE_INTERVAL) * SCALE_INTERVAL
}
const getTimeFromPosition = (position: number, rulerStartTime) => {
  const timeLength = (position / SCALE_INTERVAL) * SCALE_INTERVAL_TIME_LENGTH
  const hour = Math.floor(timeLength / 60) + rulerStartTime
  const minute = timeLength % 60
  return `${hour < 10 ? '0' + hour : hour}:${minute < 10 ? '0' + minute : minute}`
}

const AddDailyLogModal: React.FC<{
  visible: boolean
  onCancel: () => void
}> = ({ visible, onCancel }) => {
  const { dailyLogTagList = [], logKey, weekHourStart = 0, weekHourEnd = 24 } = getInitialSettings()

  /** 时间轴开始时刻 */
  const rulerStartTime = weekHourStart
  /** 时间轴展示的时间范围 */
  const totalHoursCount = weekHourEnd - weekHourStart

  const [panInfo, setPanInfo] = useState({ y: 0, distance: 0 })
  const [tag, setTag] = useState<string>()
  const [form] = Form.useForm()

  const startTime = getTimeFromPosition(panInfo.y, rulerStartTime)
  const endTime = getTimeFromPosition(panInfo.y + panInfo.distance, rulerStartTime)

  const onClickAdd = async () => {
    const { preferredDateFormat } = await logseq.App.getUserConfigs()
    const { date, content } = await form.getFieldsValue()
    const text = `${startTime}-${endTime} ${content}${tag ? ' #' + tag : ''}`

    const journalName = format(date.valueOf(), preferredDateFormat)
    await createBlockToSpecificBlock(journalName, `[[${logKey?.id}]]`, text, {})
    onCancel()
  }

  useEffect(() => {
    logseq.Editor.getCurrentPage().then((page) => {
      console.log('[faiz:] === currentPage', page)
      if (page?.['journal?']) {
        const day = dayjs(`${page?.journalDay}`, 'YYYYMMDD')
        form.setFieldsValue({ date: day })
      }
    })
  }, [])
  useEffect(() => {
    const el = document.querySelector('#time-ruler')
    if (!el) return
    const at = new AnyTouch(el, { preventDefault: false })
    at.use(pan, { threshold: 0 })
    at.on(['panstart', 'panup', 'pandown', 'panend'], (e: AnyTouchEvent) => {
      const { y, displacementY, isStart, isEnd, type, nativeEvent } = e
      if (isStart || type === 'panstart') {
        const _y = getNearestAvaliableScalePosition((nativeEvent as any).offsetY)
        setPanInfo((info) => ({ ...info, y: _y }))
      }
      const _displacementY = getNearestAvaliableScalePosition(displacementY)
      setPanInfo((info) => ({ ...info, distance: _displacementY }))
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
      placement="right"
      extra={
        <Space>
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="primary" onClick={onClickAdd}>
            Add
          </Button>
        </Space>
      }
    >
      <div className="flex flex-col h-full">
        <Form labelCol={{ span: 5 }} form={form}>
          <Form.Item name="date" label="Date" initialValue={dayjs()}>
            <DatePicker className="w-full" style={{ marginBottom: '12px' }} format="YYYY-MM-DD ddd" />
          </Form.Item>
          <Form.Item name="content" label="Content">
            <Input />
          </Form.Item>
        </Form>
        <div className="mt-3 flex flex-row">
          {/*======= time ruler selector start ====== */}
          <div
            id="time-ruler"
            className={classNames(
              s.rulerContainer,
              'bg-primary relative rounded cursor-pointer select-none ml-11 description-text'
            )}
            style={{ minHeight: HOUR_HEIGHT * totalHoursCount + 'px' }}
          >
            <div className={classNames(s.mark, 'flex flex-col justify-between h-full')}>
              {[...new Array(totalHoursCount + 1).keys()].map((_, index) => {
                const isHeadOrTail = index === 0 || index === totalHoursCount
                const _showText = index + rulerStartTime
                const showText = _showText < 10 ? '0' + _showText : _showText
                return (
                  <div key={index}>
                    <span>{isHeadOrTail ? '' : showText + ':00'}</span>
                  </div>
                )
              })}
            </div>
            <div
              id="ruler-indicator"
              className={classNames(
                s.indicator,
                'absolute top-0 box-border w-full rounded opacity-50 font-bold',
                panInfo.distance > 0 ? 'visible' : 'hidden'
              )}
              style={{ top: panInfo.y + 'px', height: panInfo.distance + 'px' }}
            >
              <span className="absolute bottom-0 left-1">
                {startTime}-{endTime}
              </span>
            </div>
          </div>
          {/*======= time ruler selector end ====== */}
          {/*======= tag selector start ====== */}
          <TagSelector options={dailyLogTagList} value={tag} onChange={(val) => setTag(val)} />
          {/*======= tag selector end ====== */}
        </div>
      </div>
    </Drawer>
  )
}

export default AddDailyLogModal

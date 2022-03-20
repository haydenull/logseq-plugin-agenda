import React, { useEffect, useState } from 'react'
import { DatePicker, Form, Input, Modal, Radio, Select } from 'antd'
import dayjs, { Dayjs } from 'dayjs'
import { ICustomCalendar, ISettingsForm, updateBlock, genSchedule } from '../util/util'
import { PageEntity } from '@logseq/libs/dist/LSPlugin.user'
import Calendar from 'tui-calendar'

export type IScheduleForm = {
  calendarId: string
  title: string
  start: Dayjs
  end: Dayjs
  isAllDay?: boolean
}
export type IScheduleValue = Partial<IScheduleForm> & { id?: number; raw?: any }

const ModifySchedule: React.FC<{
  visible: boolean
  initialValues?: IScheduleValue
  type?: 'create' | 'update'
  calendar?: Calendar
  onSave?: () => void
  onCancel?: () => void
}> = ({ visible, initialValues, onCancel, onSave, type='create', calendar }) => {
  const [agendaCalendars, setAgendaCalendars] = useState<ISettingsForm['calendarList']>([])
  const [showTime, setShowTime] = useState(!initialValues?.isAllDay)

  const [form] = Form.useForm()

  const onFormChange = (changedValues, allValues) => {
    if (changedValues.isAllDay !== undefined) {
      setShowTime(!changedValues.isAllDay)
    }
    if (changedValues.start !== undefined) {
      form.setFieldsValue({
        end: changedValues.start.add(1, 'hour'),
      })
    }
  }
  const onClickSave = () => {
    form.validateFields().then(async values => {
      const { calendarId, title, start, end, isAllDay } = values
      const startDate = dayjs(start).format('YYYY-MM-DD')
      const endDate = dayjs(end).format('YYYY-MM-DD')
      const startTime = dayjs(start).format('HH:mm')
      const endTime = dayjs(end).format('HH:mm')
      const calendarConfig = agendaCalendars.find(c => c.id === calendarId?.value)
      console.log('[faiz:] === onClickSave', values)

      if (type === 'create') {
        // create
        const block = await logseq.Editor.insertBlock(calendarId?.value, `TODO ${title}`, {
          isPageBlock: true,
          sibling: true,
          properties: {
            start: isAllDay ? startDate : `${startDate} ${startTime}`,
            end: isAllDay ? endDate : `${endDate} ${endTime}`,
          },
        })
        if (!block) return
        const _block = await logseq.Editor.getBlock(block.uuid)
        console.log('[faiz:] === block', block, _block)
        calendar?.createSchedules([genSchedule({
          blockData: _block,
          category: isAllDay ? 'allday' : 'time',
          start: dayjs(start).format(),
          end: dayjs(end).format(),
          // @ts-ignore
          calendarConfig,
          isAllDay,
          isReadOnly: false,
        })])
      } else if (calendarId?.value !== initialValues?.calendarId && initialValues?.id) {
        // move
        const block = await logseq.Editor.getBlock(initialValues.id)
        if (!block) return logseq.App.showMsg('Block not found', 'error')
        const page = await logseq.Editor.getPage(calendarId?.value)
        if (!page) return logseq.App.showMsg('Calendar page not found')
        await logseq.Editor.removeBlock(block.uuid)
        const newBlock = await logseq.Editor.insertBlock(calendarId?.value, title, {
          isPageBlock: true,
          sibling: true,
          properties: block.properties,
        })
        if (!newBlock || !initialValues.calendarId) return
        const _newBlock = await logseq.Editor.getBlock(newBlock.uuid)
        console.log('[faiz:] === _newBlock', _newBlock)
        // updateSchedule can't update id, so we need to create new schedule after delete old one
        calendar?.deleteSchedule(initialValues.id as unknown as string, initialValues.calendarId)
        calendar?.createSchedules([genSchedule({
          blockData: _newBlock,
          category: isAllDay ? 'allday' : 'time',
          start: dayjs(start).format(),
          end: dayjs(end).format(),
          // @ts-ignore
          calendarConfig,
          isAllDay,
          isReadOnly: false,
        })])
        // calendar?.updateSchedule(initialValues.id as unknown as string, initialValues.calendarId, )
        // MoveBlock does not appear to support moving between pages
        // logseq.Editor.moveBlock(block?.uuid, page.uuid)
      } else if (initialValues?.id) {
        // update
        await updateBlock(initialValues.id, title, {
          start: isAllDay ? startDate : `${startDate} ${startTime}`,
          end: isAllDay ? endDate : `${endDate} ${endTime}`,
        })
        const _newBlock = await logseq.Editor.getBlock(initialValues.id)
        calendar?.updateSchedule(initialValues.id as unknown as string, calendarId?.value,  genSchedule({
          blockData: _newBlock,
          category: isAllDay ? 'allday' : 'time',
          start: dayjs(start).format(),
          end: dayjs(end).format(),
          // @ts-ignore
          calendarConfig,
          isAllDay,
          isReadOnly: false,
        }))
      }
      onSave?.()
    })
  }
  const onClickCancel = () => {
    onCancel?.()
  }

  useEffect(() => {
    const { calendarList } = logseq.settings as unknown as ISettingsForm
    const calendarPagePromises = calendarList.map(calendar => logseq.Editor.getPage(calendar.id))
    Promise.all(calendarPagePromises).then((pages: (PageEntity | null)[]) => {
      console.log('[faiz:] === page', pages)

      const agendaPages = pages
                            .map((page, index) => {
                              if (!page) return page
                              if ((page as any)?.properties?.agenda !== true) return null
                              return calendarList[index]
                            })
                            .filter(function<T>(item: T | null): item is T { return Boolean(item) })
      if (agendaPages?.length <= 0) return logseq.App.showMsg('No agenda page found\nPlease create an agenda calendar first', 'error')
      setAgendaCalendars(agendaPages)
    })
  }, [])

  return (
    <Modal
      title="Modify Schedule"
      visible={visible}
      onOk={onClickSave}
      onCancel={onClickCancel}
    >
      <Form
        form={form}
        onValuesChange={onFormChange}
        initialValues={{ ...initialValues, calendarId: initialValues?.calendarId ? { value: initialValues?.calendarId } : undefined }}
      >
        <Form.Item name="calendarId" label="Calendar" rules={[{ required: true }]}>
          <Select labelInValue>
            {agendaCalendars.map(calendar => (
              <Select.Option key={calendar.id} value={calendar.id}>
                <span style={{ width: '12px', height: '12px', display: 'inline-block', backgroundColor: calendar.bgColor, verticalAlign: 'middle', marginRight: '5px', borderRadius: '4px'}}></span>
                {calendar.id}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="title" label="Schedule Title" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="start" label="Start" rules={[{ required: true }]}>
          <DatePicker showTime={showTime ? { format: 'HH:mm' } : false} />
        </Form.Item>
        <Form.Item name="end" label="End" rules={[{ required: true }]}>
          <DatePicker showTime={showTime ? { format: 'HH:mm' } : false} />
        </Form.Item>
        <Form.Item name="isAllDay" label="All Day" rules={[{ required: true }]}>
          <Radio.Group>
            <Radio value={true}>Yes</Radio>
            <Radio value={false}>No</Radio>
          </Radio.Group>
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default ModifySchedule

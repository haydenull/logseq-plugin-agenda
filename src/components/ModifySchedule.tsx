import React, { useEffect, useState } from 'react'
import { DatePicker, Form, Input, Modal, Radio, Select } from 'antd'
import dayjs from 'dayjs'

export type IAgendaForm = {
  calendarId: string
  title: string
  start: number
  end: number
  isAllDay?: boolean
}

const ModifySchedule: React.FC<{
  visible: boolean
  initialValues?: Omit<IAgendaForm, 'title' | 'calendarId'>
  onSave?: (params: IAgendaForm) => void
  onCancel?: () => void
}> = ({ visible, initialValues, onCancel, onSave }) => {
  const [agendaCalendars, setAgendaCalendars] = useState<{label: string; value: string}[]>([])
  const [showTime, setShowTime] = useState(false)

  const [form] = Form.useForm()

  const onFormChange = (changedValues, allValues) => {
    if (changedValues.isAllDay) {
      setShowTime(!changedValues.isAllDay)
    }
  }
  const onClickSave = () => {
    form.validateFields().then(async values => {
      const { calendarId, title, start, end, allDay } = values
      const startDate = dayjs(start).format('YYYY-MM-DD')
      const endDate = dayjs(end).format('YYYY-MM-DD')
      const startTime = dayjs(start).format('HH:mm:ss')
      const endTime = dayjs(end).format('HH:mm:ss')
      const params = {
        calendarId,
        title,
        start: `${startDate}T${startTime}`,
        end: `${endDate}T${endTime}`,
        allDay,
      }
      console.log('[faiz:] === onClickSave', values)
      // onSave(params)
    })
  }
  const onClickCancel = () => {
    onCancel?.()
  }

  useEffect(() => {
    logseq.DB.q(`(page-property agenda "true")`)
      .then(pages => {
        if (pages && pages?.length > 0) {
          setAgendaCalendars(pages.map(page => ({ label: page.originalName, value: page.originalName })))
          return
        }
        logseq.App.showMsg('No agenda page found', 'error')
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
        initialValues={initialValues}
      >
        <Form.Item name="calendarId" label="Calendar">
          <Select options={agendaCalendars} />
        </Form.Item>
        <Form.Item name="title" label="Agenda Title">
          <Input />
        </Form.Item>
        <Form.Item name="start" label="Start">
          <DatePicker showTime={showTime} />
        </Form.Item>
        <Form.Item name="end" label="End">
          <DatePicker showTime={showTime} />
        </Form.Item>
        <Form.Item name="isAllDay" label="All Day">
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

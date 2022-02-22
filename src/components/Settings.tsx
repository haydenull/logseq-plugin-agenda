import React, { useState } from 'react'
import { Modal, Form, Select, Input } from 'antd'
import { QuestionCircleOutlined } from '@ant-design/icons'
import { CALENDAR_VIEWS } from '../util'
import { useForm } from 'antd/lib/form/Form'

export type ISettingForm = Partial<{
  defaultView: string
  weekStartDay: 0 | 1
  journalDateFormatter: string
  logKey: string
}>

const getInitalSettingForm = (): ISettingForm => ({
  defaultView: logseq.settings?.defaultView || 'week',
  weekStartDay: logseq.settings?.weekStartDay || 0,
  journalDateFormatter: logseq.settings?.journalDateFormatter || 'YYYY-MM-DD ddd',
  logKey: logseq.settings?.logKey || 'Daily Log',
})

const Settings: React.FC<{
  visible: boolean
  onCancel: () => void
  onOk: (values: ISettingForm) => void
  [key: string]: any
}> = ({ visible, onCancel, onOk, ...props }) => {
  const [settingForm] = useForm<ISettingForm>()

  const onClickSettingSave = () => {
    settingForm.validateFields().then(values => {
      console.log('[faiz:] === values', values)
      onOk(values)
      // if (values.weekStartDay !== logseq.settings?.weekStartDay) {
      //   calendarRef.current?.setOptions({
      //     week: {
      //       startDayOfWeek: values.weekStartDay,
      //     },
      //     month: {
      //       startDayOfWeek: values.weekStartDay,
      //     },
      //   })
      // }
      // if (values.logKey !== logseq.settings?.logKey) setSchedules()
      // logseq.updateSettings(values)
    })
  }

  return (
    <Modal
      {...props}
      destroyOnClose
      title="Calendar Setting"
      okText="Save"
      visible={visible}
      onCancel={onCancel}
      onOk={onClickSettingSave}
    >
      <Form initialValues={getInitalSettingForm()} form={settingForm} labelCol={{ span: 10 }} preserve={false}>
        <Form.Item label="Default View" name="defaultView" rules={[{ required: true }]}>
          <Select options={CALENDAR_VIEWS} />
        </Form.Item>
        <Form.Item label="Week Start Day" name="weekStartDay" rules={[{ required: true }]}>
          <Select>
            <Select.Option value={0}>Sunday</Select.Option>
            <Select.Option value={1}>Monday</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item label="Journal Date Formatter" required>
          <div className="flex items-center">
            <Form.Item name="journalDateFormatter" noStyle rules={[{ required: true }]} getValueFromEvent={(e) => e.target.value.trim()}><Input /></Form.Item>
            <QuestionCircleOutlined className="ml-1" onClick={() => logseq.App.openExternalLink('https://day.js.org/docs/en/display/format')} />
          </div>
        </Form.Item>
        <Form.Item label="Log Key" name="logKey" rules={[{ required: true }]} getValueFromEvent={(e) => e.target.value.trim()}>
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default Settings

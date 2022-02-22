import React, { useState } from 'react'
import { Modal, Form, Select, Input, Button, Space, Switch } from 'antd'
import { QuestionCircleOutlined, MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'
import { CALENDAR_VIEWS } from '../util'
import { useForm } from 'antd/lib/form/Form'

export type ISettingForm = Partial<{
  defaultView: string
  weekStartDay: 0 | 1
  journalDateFormatter: string
  logKey: string
  calendarList: {
    id: string
    bgColor: string
    textColor: string
    enabled: boolean
  }[]
}>

const getInitalSettingForm = (): ISettingForm => ({
  defaultView: logseq.settings?.defaultView || 'week',
  weekStartDay: logseq.settings?.weekStartDay || 0,
  journalDateFormatter: logseq.settings?.journalDateFormatter || 'YYYY-MM-DD ddd',
  logKey: logseq.settings?.logKey || 'Daily Log',
  calendarList: logseq.settings?.calendarList || [
    {
      id: 'journal',
      bgColor: '#f5f5f5',
      textColor: '#fff',
      enabled: true,
    },
  ],
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
      width={600}
      destroyOnClose
      title="Calendar Setting"
      okText="Save"
      visible={visible}
      onCancel={onCancel}
      onOk={onClickSettingSave}
    >
      <Form initialValues={getInitalSettingForm()} form={settingForm} labelCol={{ span: 7 }} preserve={false}>
        <Form.Item label="Default View" name="defaultView" rules={[{ required: true }]}>
          <Select options={CALENDAR_VIEWS} />
        </Form.Item>
        <Form.Item label="Week Start Day" name="weekStartDay" rules={[{ required: true }]}>
          <Select>
            <Select.Option value={0}>Sunday</Select.Option>
            <Select.Option value={1}>Monday</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item label="Journal Date Formatter" required labelCol={{ span: 9 }}>
          <div className="flex items-center">
            <Form.Item name="journalDateFormatter" noStyle rules={[{ required: true }]} getValueFromEvent={(e) => e.target.value.trim()}><Input /></Form.Item>
            <QuestionCircleOutlined className="ml-1" onClick={() => logseq.App.openExternalLink('https://day.js.org/docs/en/display/format')} />
          </div>
        </Form.Item>
        <Form.Item label="Log Key" name="logKey" rules={[{ required: true }]} getValueFromEvent={(e) => e.target.value.trim()}>
          <Input />
        </Form.Item>
        <Form.List name="calendarList">
          {(fields, { add, remove }) => (<>
            {fields.map((field, index) => (
              <Form.Item required label={index === 0 ? 'Calendars' : ''} {...(index === 0 ? {} : { wrapperCol: {offset: 7} })}>
                <div className="flex items-center justify-between">
                  <Form.Item name={[field.name, 'id']} noStyle>
                    <Input placeholder="Please input calendar key" disabled={index === 0} style={{ width: '180px' }} />
                  </Form.Item>
                  <Form.Item name={[field.name, 'bgColor']} noStyle>
                    <div>bg color</div>
                  </Form.Item>
                  <Form.Item name={[field.name, 'textColor']} noStyle>
                    <div>text color</div>
                  </Form.Item>
                  <Form.Item name={[field.name, 'enabled']} noStyle valuePropName="checked">
                    <Switch size="small" />
                  </Form.Item>
                  {index !== 0 ? <MinusCircleOutlined onClick={() => remove(field.name)} /> : <div style={{ width: '14px' }}></div>}
                </div>
              </Form.Item>
            ))}
            <Form.Item wrapperCol={{ offset: 7 }}>
              <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                Add sights
              </Button>
            </Form.Item>
          </>)}
        </Form.List>
      </Form>
    </Modal>
  )
}

export default Settings

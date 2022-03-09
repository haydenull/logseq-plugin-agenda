import React, { useState } from 'react'
import { Modal, Form, Select, Input, Button, Switch, Tooltip, Popconfirm } from 'antd'
import { QuestionCircleOutlined, MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'
import { genDefaultQuery, getInitalSettings, ISettingsForm, ISettingsFormQuery } from '../util/util'
import { useForm } from 'antd/lib/form/Form'
import ColorPicker from './ColorPicker'
import { CALENDAR_VIEWS, DEFAULT_SETTINGS, THEME } from '../util/constants'
import Query from './Query'
import CreateCalendarModal from './CreateCalendarModal'


const Settings: React.FC<{
  visible: boolean
  onCancel: () => void
  onOk: (values: ISettingsForm) => void
  [key: string]: any
}> = ({ visible, onCancel, onOk, ...props }) => {
  const [settingForm] = useForm<ISettingsForm>()

  const [createCalendarModalVisible, setCreateCalendarModalVisible] = useState(false)

  const initialValues = getInitalSettings()

  const onClickSettingSave = () => {
    settingForm.validateFields().then(values => {
      onOk(values)
    })
  }
  const onCreateCalendarModalOk = (calendarId: string) => {
    settingForm.setFieldsValue({
      calendarList: [
        ...settingForm.getFieldValue('calendarList'),
        genDefaultQuery(calendarId),
      ]
    })
    setCreateCalendarModalVisible(false)
  }

  console.log('[faiz:] === initialValues', initialValues)

  return (
    <>
      <Modal
        {...props}
        width={700}
        destroyOnClose
        title="Calendar Setting"
        visible={visible}
        onCancel={onCancel}
        footer={
          <div className="flex justify-between" onClick={e => e?.stopPropagation?.()}>
            <Popconfirm
              title={<span>Are you sure you want to restore default setting?<br />This is an irreversible operation.</span>}
              onConfirm={() => {
                settingForm.setFieldsValue(DEFAULT_SETTINGS)
                onClickSettingSave()
              }}
            >
              <Button type="link">Restore Defaults</Button>
            </Popconfirm>
            <div>
              <Button onClick={onCancel}>Cancel</Button>
              <Button type="primary" onClick={onClickSettingSave}>Save</Button>
            </div>
          </div>
        }
      >
        <Form initialValues={initialValues} labelCol={{ span: 7 }} preserve={true} form={settingForm}>
          <Form.Item label="Theme" name="theme">
            <Select options={THEME} />
          </Form.Item>
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
              <Tooltip title="View Formatter's rules">
                <QuestionCircleOutlined className="ml-1" onClick={() => logseq.App.openExternalLink('https://day.js.org/docs/en/display/format')} />
              </Tooltip>
            </div>
          </Form.Item>
          <Form.Item label="Log Key" required>
            <div className="flex items-center justify-between">
              <Form.Item noStyle name={['logKey', 'id']} rules={[{ required: true }]}>
                <Input style={{ width: '110px' }} />
              </Form.Item>
              <Form.Item name={['logKey', 'bgColor']} noStyle rules={[{ required: true }]}>
                <ColorPicker text="background" />
              </Form.Item>
              <Form.Item name={['logKey', 'textColor']} noStyle rules={[{ required: true }]}>
                <ColorPicker text="text" />
              </Form.Item>
              <Form.Item name={['logKey', 'borderColor']} noStyle rules={[{ required: true }]}>
                <ColorPicker text="border" />
              </Form.Item>
              <Form.Item name={['logKey', 'enabled']} noStyle valuePropName="checked">
                <Switch size="small" />
              </Form.Item>
              <div style={{ width: '60px' }}></div>
            </div>
          </Form.Item>
          <Form.List name="calendarList">
            {(fields, { add, remove }) => (<>
              {fields.map((field, index) => (
                <Form.Item required label={index === 0 ? 'Calendars' : ''} {...(index === 0 ? {} : { wrapperCol: {offset: 7} })}>
                  <div className="flex items-center justify-between">
                    <Form.Item name={[field.name, 'id']} noStyle rules={[{ required: true }]}>
                      <Input placeholder="Calendar ID" disabled={index === 0} style={{ width: '110px' }} />
                    </Form.Item>
                    <Form.Item name={[field.name, 'bgColor']} noStyle rules={[{ required: true }]}>
                      <ColorPicker text="background" />
                    </Form.Item>
                    <Form.Item name={[field.name, 'textColor']} noStyle rules={[{ required: true }]}>
                      <ColorPicker text="text" />
                    </Form.Item>
                    <Form.Item name={[field.name, 'borderColor']} noStyle rules={[{ required: true }]}>
                      <ColorPicker text="border" />
                    </Form.Item>
                    <Form.Item name={[field.name, 'query']} noStyle rules={[{ required: true }]}>
                      <Query calendarId='query' />
                    </Form.Item>
                    <Form.Item name={[field.name, 'enabled']} noStyle valuePropName="checked">
                      <Switch size="small" />
                    </Form.Item>
                    {index !== 0 ? <MinusCircleOutlined onClick={() => remove(field.name)} /> : <div style={{ width: '14px' }}></div>}
                  </div>
                </Form.Item>
              ))}
              <Form.Item wrapperCol={{ offset: 7 }}>
                <Button type="dashed" size="small" onClick={() => setCreateCalendarModalVisible(true)} block icon={<PlusOutlined />}>
                  Add Calendar
                </Button>
              </Form.Item>
            </>)}
          </Form.List>
        </Form>
        <CreateCalendarModal
          visible={createCalendarModalVisible}
          onSave={onCreateCalendarModalOk}
          onCancel={() => setCreateCalendarModalVisible(false)}
        />
      </Modal>
    </>
  )
}

export default Settings

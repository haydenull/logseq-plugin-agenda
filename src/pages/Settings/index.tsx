import React, { useState } from 'react'
import { Modal, Form, Select, Input, Button, Switch, Popconfirm, InputNumber } from 'antd'
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'
import { useForm } from 'antd/lib/form/Form'
import classNames from 'classnames'
import ColorPicker from '@/components/ColorPicker'
import { CALENDAR_VIEWS, DEFAULT_SETTINGS, DURATION_UNITS, THEME } from '@/util/constants'
import Query from '@/components/Query'
import CreateCalendarModal from '@/components/CreateCalendarModal'
import type { ISettingsForm } from '@/util/type'
import { getInitalSettings, genAgendaQuery, genDefaultQuery } from '@/util/baseInfo'
import { useAtom } from 'jotai'
import { projectSchedulesAtom, subscriptionSchedulesAtom } from '@/model/schedule'
import { settingsAtom } from '@/model/settings'
import { getSchedules } from '@/util/schedule'
import { getSubCalendarSchedules } from '@/util/subscription'

import Tabs from './components/Tabs'
import s from './index.module.less'

const TABS = [
  { value: 'basis', label: 'Basis' },
  { value: 'calendar', label: 'Calendar' },
  { value: 'projects', label: 'Projects' },
  { value: 'subscription', label: 'Subscription' },
]


const Settings: React.FC<{
  // visible: boolean
  // onCancel: () => void
  // onOk: (values: ISettingsForm) => void
  [key: string]: any
}> = ({ ...props }) => {
  const [settingForm] = useForm<ISettingsForm>()
  const [tab, setTab] = useState(TABS[0].value)

  const [createCalendarModalVisible, setCreateCalendarModalVisible] = useState(false)
  const initialValues = getInitalSettings()
  // TODO: 使用 only-write 减少重新渲染
  const [, setProjectSchedules] = useAtom(projectSchedulesAtom)
  const [, setSubscriptionSchedules] = useAtom(subscriptionSchedulesAtom)
  const [, setSettings] = useAtom(settingsAtom)

  const onClickSettingSave = () => {
    settingForm.validateFields().then(values => {
      // onOk(values)
    })
  }
  const onTabChange = (value: string) => {
    setTab(value)
  }
  const onCreateCalendarModalOk = ({ name: calendarId, agenda = false }) => {
    settingForm.setFieldsValue({
      calendarList: [
        ...settingForm.getFieldValue('calendarList'),
        agenda ? genAgendaQuery(calendarId) : genDefaultQuery(calendarId),
      ]
    })
    setCreateCalendarModalVisible(false)
  }
  const onValuesChange = (changedValues: Partial<ISettingsForm>, allValues: ISettingsForm) => {
    console.log('[faiz:] === onValuesChange', changedValues, allValues)
    setSettings(allValues)
    // hack https://github.com/logseq/logseq/issues/4447
    logseq.updateSettings({calendarList: 1, subscriptionList: 1})
    // ensure subscription list is array
    logseq.updateSettings({subscriptionList: [], ...allValues})

    // exec after 500ms to make sure the settings are updated
    setTimeout(async () => {
      // managePluginTheme()
      if (changedValues?.calendarList) {
        setProjectSchedules(await getSchedules())
      }
      if (changedValues?.subscriptionList) {
        const { subscriptionList } = await getInitalSettings()
        setSubscriptionSchedules(await getSubCalendarSchedules(subscriptionList))
      }
    }, 500)
  }

  return (
    <div className="page-container p-8 flex flex-col items-center">
      <h1 className={s.title}>Settings</h1>
      <div className={classNames(s.content, 'rounded-2xl flex')}>
        <Tabs value={tab} tabs={TABS} onChange={onTabChange} />
        <Form
          initialValues={initialValues}
          labelCol={{ span: 4 }}
          preserve={true}
          form={settingForm}
          style={{ maxWidth: '700px', width: '80%' }}
          onValuesChange={onValuesChange}
          className="relative h-full"
        >
          <div id="basis" className={classNames(s.formBlock, { [s.show]: tab === 'basis' })}>
            <Form.Item label="Theme" name="theme">
              <Select options={THEME} />
            </Form.Item>
            <Form.Item label="Default Duration" name={["defaultDuration", 'value']}>
              <InputNumber
                addonAfter={
                  <Form.Item name={["defaultDuration", 'unit']} noStyle>
                    <Select style={{ width: 80 }} options={DURATION_UNITS} />
                  </Form.Item>
                }
              />
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
          </div>
          <div id="calendar" className={classNames(s.formBlock, { [s.show]: tab === 'calendar' })}>
            <Form.Item label="Default View" name="defaultView" rules={[{ required: true }]}>
              <Select options={CALENDAR_VIEWS} />
            </Form.Item>
            <Form.Item label="Week Start Day" name="weekStartDay" rules={[{ required: true }]}>
              <Select>
                <Select.Option value={0}>Sunday</Select.Option>
                <Select.Option value={1}>Monday</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item label="Time Grid">
              <div className="flex items-center">
                <Form.Item noStyle name="weekHourStart">
                  <InputNumber min={0} max={24} />
                </Form.Item>
                <span className="px-2">-</span>
                <Form.Item noStyle name="weekHourEnd">
                  <InputNumber min={0} max={24} />
                </Form.Item>
              </div>
            </Form.Item>
          </div>
          <div id="projects" className={classNames(s.formBlock, { [s.show]: tab === 'projects' })}>
            <Form.List name="calendarList">
              {(fields, { add, remove }) => (<>
                {fields.map((field, index) => (
                  <Form.Item required label={index === 0 ? 'Calendar' : ''} {...(index === 0 ? {} : { wrapperCol: {offset: 7} })}>
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
          </div>
          <div id="subscription" className={classNames(s.formBlock, { [s.show]: tab === 'subscription' })}>
            <Form.List name="subscriptionList">
              {(fields, { add, remove }) => (<>
                {fields.map((field, index) => (
                  <Form.Item label={index === 0 ? 'Subscription' : ''} {...(index === 0 ? {} : { wrapperCol: {offset: 7} })}>
                    <div className="flex items-center justify-between">
                      <Form.Item name={[field.name, 'id']} noStyle rules={[{ required: true }]}>
                        <Input placeholder="Calendar ID" style={{ width: '100px' }} />
                      </Form.Item>
                      <Form.Item name={[field.name, 'url']} noStyle rules={[{ required: true, type: 'url' }]}>
                        <Input placeholder="Url" style={{ width: '100px' }} />
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
                      <Form.Item name={[field.name, 'enabled']} noStyle valuePropName="checked">
                        <Switch size="small" />
                      </Form.Item>
                      <MinusCircleOutlined onClick={() => remove(field.name)} />
                    </div>
                  </Form.Item>
                ))}
                <Form.Item wrapperCol={{ offset: 7 }}>
                  <Button type="dashed" size="small" onClick={() => add()} block icon={<PlusOutlined />}>
                    Add Subscription
                  </Button>
                </Form.Item>
              </>)}
            </Form.List>
          </div>
        </Form>
      </div>
        <CreateCalendarModal
          visible={createCalendarModalVisible}
          onSave={onCreateCalendarModalOk}
          onCancel={() => setCreateCalendarModalVisible(false)}
        />
    </div>
  )
}

export default Settings

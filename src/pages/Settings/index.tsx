import React, { useState } from 'react'
import { Modal, Form, Select, Input, Button, Switch, Popconfirm, InputNumber } from 'antd'
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'
import { useForm } from 'antd/lib/form/Form'
import classNames from 'classnames'
import ColorPicker from '@/components/ColorPicker'
import { CALENDAR_VIEWS, DEFAULT_SETTINGS, DURATION_UNITS, LIGHT_THEME_TYPE, THEME } from '@/util/constants'
import Query from '@/components/Query'
import CreateCalendarModal from '@/components/CreateCalendarModal'
import type { ISettingsForm } from '@/util/type'
import { getInitalSettings, genAgendaQuery, genDefaultQuery } from '@/util/baseInfo'
import { useAtom } from 'jotai'
import { projectSchedulesAtom, subscriptionSchedulesAtom } from '@/model/schedule'
import { settingsAtom } from '@/model/settings'
import { getSchedules } from '@/util/schedule'
import { getSubCalendarSchedules } from '@/util/subscription'
import { motion } from 'framer-motion'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'

import Tabs from './components/Tabs'
import s from './index.module.less'
import { MENUS } from '@/constants/elements'
import { managePluginTheme } from '@/util/util'

const TABS = [
  { value: 'basis', label: 'Basis' },
  { value: 'calendarView', label: 'Calendar View' },
  { value: 'project', label: 'Projects' },
  { value: 'customCalendar', label: 'Custom Calendar' },
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

  const onTabChange = (value: string) => {
    setTab(value)
  }
  const onCreateCalendarModalOk = ({ name: calendarId, agenda = false }) => {
    const calendarList = [
      ...settingForm.getFieldValue('calendarList'),
      agenda ? genAgendaQuery(calendarId) : genDefaultQuery(calendarId),
    ]
    settingForm.setFieldsValue({ calendarList })
    setCreateCalendarModalVisible(false)
    // fix https://github.com/ant-design/ant-design/issues/23156
    onValuesChange({ calendarList }, settingForm.getFieldsValue(true))
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
      if (changedValues?.lightThemeType || changedValues.theme) {
        managePluginTheme()
      }
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
      <h1 className={classNames(s.title, 'title-text')}>Settings</h1>
      <div className={classNames(s.content, 'rounded-2xl flex')}>
        <div className="flex flex-col justify-between pr-5">
          <Tabs value={tab} tabs={TABS} onChange={onTabChange} />
          <Popconfirm
            title={<span>Are you sure you want to restore default settings?<br />This is an irreversible operation.</span>}
            onConfirm={() => {
              settingForm.setFieldsValue(DEFAULT_SETTINGS)
              onValuesChange(DEFAULT_SETTINGS, DEFAULT_SETTINGS)
            }}
          >
            <Button className="text-left" type="link" style={{ color: 'var(--ls-tertiary-background-color)' }}>Restore Defaults</Button>
          </Popconfirm>
        </div>
        <Form
          initialValues={initialValues}
          labelCol={{ span: 4 }}
          preserve={true}
          form={settingForm}
          style={{ maxWidth: '800px', width: '80%' }}
          onValuesChange={onValuesChange}
          className="relative h-full"
        >
          <div id="basis" className={classNames(s.formBlock, { [s.show]: tab === 'basis' })}>
            <Form.Item label="Theme" name="theme">
              <Select options={THEME} />
            </Form.Item>
            <Form.Item label="Light Theme Type" name="lightThemeType">
              <Select options={LIGHT_THEME_TYPE} />
            </Form.Item>
            <Form.Item label="Home Page" name="homePage">
              <Select options={MENUS} />
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
                <Input style={{ width: '240px' }} />
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
                <Switch />
              </Form.Item>
              {/* <div style={{ width: '60px' }}></div> */}
            </div>
          </Form.Item>
          </div>
          <div id="calendar" className={classNames(s.formBlock, { [s.show]: tab === 'calendarView' })}>
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
            <Form.List name="projectList">
              {(fields, { add, remove, move }) => (<>
                <DragDropContext onDragEnd={(e) => {
                  console.log('[faiz:] === onDragEnd', e)
                  if (e?.destination) move(e.source.index, e.destination.index)
                }}>
                  <Droppable droppableId="droppable-projects">
                    {(provided, snapshot) => (
                      <div ref={provided.innerRef}>
                        {fields.map((field, index) => (
                          <Draggable draggableId={`drag ${index}`} index={index} key={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                              >
                                <Form.Item>
                                  <div className="flex items-center justify-between">
                                    <Form.Item name={[field.name, 'id']} noStyle rules={[{ required: true }]}>
                                      <Input placeholder="Project ID (Page Name)" style={{ width: '300px' }} />
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
                                      <Switch />
                                    </Form.Item>
                                    <MinusCircleOutlined onClick={() => remove(field.name)} />
                                  </div>
                                </Form.Item>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        <Form.Item>
                          <Button type="dashed" onClick={() => add({ id: undefined, bgColor: '#b8e986', textColor: '#4a4a4a', borderColor: '#047857', enabled: true })} block icon={<PlusOutlined />}>
                            Add Project
                          </Button>
                        </Form.Item>
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </>)}
            </Form.List>
          </div>
          <div id="customCalendar" className={classNames(s.formBlock, { [s.show]: tab === 'customCalendar' })}>
            <Form.List name="calendarList">
              {(fields, { add, remove, move }) => (<>
                <DragDropContext onDragEnd={(e) => {
                  console.log('[faiz:] === onDragEnd', e)
                  if (e?.destination?.index === 0 || e?.source?.index === 0) return
                  if (e?.destination) move(e.source.index, e.destination.index)
                }}>
                  <Droppable droppableId="droppable-1">
                    {(provided, snapshot) => (
                      <div ref={provided.innerRef}>
                        {fields.map((field, index) => (
                          <Draggable draggableId={`drag ${index}`} index={index} key={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                              >
                                <Form.Item
                                  required
                                  label={index === 0 ? 'Calendar' : ''} {...(index === 0 ? {} : { wrapperCol: {offset: 4} })}
                                >
                                  <div className="flex items-center justify-between">
                                    <Form.Item name={[field.name, 'id']} noStyle rules={[{ required: true }]}>
                                      <Input placeholder="Calendar ID" disabled={index === 0} style={{ width: '240px' }} />
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
                                      <Switch />
                                    </Form.Item>
                                    {index !== 0 ? <MinusCircleOutlined onClick={() => remove(field.name)} /> : <div style={{ width: '14px' }}></div>}
                                  </div>
                                </Form.Item>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        <Form.Item wrapperCol={{ offset: 4 }}>
                          <Button type="dashed" onClick={() => setCreateCalendarModalVisible(true)} block icon={<PlusOutlined />}>
                            Add Custom Calendar
                          </Button>
                        </Form.Item>
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </>)}
            </Form.List>
          </div>
          <div id="subscription" className={classNames(s.formBlock, { [s.show]: tab === 'subscription' })}>
            <Form.List name="subscriptionList">
              {(fields, { add, remove }) => (<>
                {fields.map((field, index) => (
                  <Form.Item label={index === 0 ? 'Subscription' : ''} {...(index === 0 ? {} : { wrapperCol: {offset: 4} })}>
                    <div className="flex items-center justify-between">
                      <Form.Item name={[field.name, 'id']} noStyle rules={[{ required: true }]}>
                        <Input placeholder="Calendar ID" style={{ width: '160px' }} />
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
                        <Switch />
                      </Form.Item>
                      <MinusCircleOutlined onClick={() => remove(field.name)} />
                    </div>
                  </Form.Item>
                ))}
                <Form.Item wrapperCol={{ offset: 4 }}>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
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

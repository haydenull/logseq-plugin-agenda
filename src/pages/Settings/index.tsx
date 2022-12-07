import React, { useEffect, useState } from 'react'
import { Form, Select, Input, Button, Switch, Popconfirm, InputNumber, Alert } from 'antd'
import { MinusCircleOutlined, PlusOutlined, QuestionCircleOutlined } from '@ant-design/icons'
import classNames from 'classnames'
import ColorPicker from '@/components/ColorPicker'
import { CALENDAR_VIEWS, DEFAULT_PROJECT, DEFAULT_SETTINGS, DURATION_UNITS, LIGHT_THEME_TYPE, THEME } from '@/util/constants'
import Query from '@/components/Query'
import CreateCalendarModal from '@/components/CreateCalendarModal'
import type { ISettingsForm } from '@/util/type'
import { getInitalSettings, genAgendaQuery, genDefaultQuery } from '@/util/baseInfo'
import { useAtom } from 'jotai'
import { subscriptionSchedulesAtom } from '@/model/schedule'
import { settingsAtom } from '@/model/settings'
import { getSubCalendarSchedules } from '@/util/subscription'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { set, get, cloneDeep } from 'lodash'

import Tabs from './components/Tabs'
import s from './index.module.less'
import { MENUS } from '@/constants/elements'
import { managePluginTheme } from '@/util/util'
import dayjs from 'dayjs'
import { getTodoistInstance } from '@/helper/todoist'
import { TodoistApi } from '@doist/todoist-api-typescript'
import { autoTextColor } from '@/helper/autoTextColor'

const TABS = [
  { value: 'basis', label: 'Basis' },
  { value: 'projects', label: 'Project' },
  { value: 'customCalendar', label: 'Custom Calendar' },
  { value: 'subscription', label: 'Subscription' },
  { value: 'calendarView', label: 'Calendar View' },
  { value: 'pomodoro', label: 'Pomodoro' },
  { value: 'todoist', label: 'Todoist' },
]


const Settings: React.FC<{
  // visible: boolean
  // onCancel: () => void
  // onOk: (values: ISettingsForm) => void
  [key: string]: any
}> = ({ ...props }) => {
  const [settingForm] = Form.useForm<ISettingsForm>()
  const [tab, setTab] = useState(TABS[0].value)
  const [pageOptions, setPageOptions] = useState<any>([])
  const [todoistProjectOptions, setTodoistProjectOptions] = useState<any>([])
  const [todoistLabelOptions, setTodoistLabelOptions] = useState<any>([])

  const [createCalendarModalVisible, setCreateCalendarModalVisible] = useState(false)
  const initialValues = getInitalSettings({ filterInvalideProject: false })
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
    let _allValues = cloneDeep(allValues);

    // Automatically changes the color of text and border when the background color changes
    ['logKey', 'journal'].forEach(key => {
      const bgColor = get(changedValues, [key, 'bgColor'])
      if (bgColor) {
        const textColor = autoTextColor(bgColor)
        settingForm.setFieldValue([key, 'textColor'], textColor)
        settingForm.setFieldValue([key, 'borderColor'], bgColor)
        set(_allValues, [key, 'textColor'], textColor)
        set(_allValues, [key, 'borderColor'], bgColor)
      }
    });
    ['projectList', 'calendarList', 'subscriptionList'].forEach(key => {
      const index = get(changedValues, [key])?.findIndex(Boolean)
      const bgColor = get(changedValues, [key, index, 'bgColor'])
      if (bgColor) {
        const textColor = autoTextColor(bgColor)
        settingForm.setFieldValue([key, index, 'textColor'], textColor)
        settingForm.setFieldValue([key, index, 'borderColor'], bgColor)
        set(_allValues, [key, index, 'textColor'], textColor)
        set(_allValues, [key, index, 'borderColor'], bgColor)
      }
    });

    if (changedValues.todoist?.token?.length === 40) {
      const todoist = getTodoistInstance(changedValues.todoist?.token)
      setTodoistOptions(todoist)
    }
    setSettings(_allValues)
    // hack https://github.com/logseq/logseq/issues/4447
    logseq.updateSettings({calendarList: 1, subscriptionList: 1, projectList: 1})
    logseq.updateSettings({
      // ensure subscription list is array
      subscriptionList: [],
      projectList: [],
      ..._allValues,
      // supports delete ignore tag
      ignoreTag: _allValues.ignoreTag || null,
    })

    if (typeof changedValues.weekStartDay === 'number') {
      dayjs.updateLocale('en', {
        weekStart: changedValues.weekStartDay,
      })
    }

    // exec after 500ms to make sure the settings are updated
    setTimeout(async () => {
      if (changedValues?.lightThemeType || changedValues.theme) {
        managePluginTheme()
      }
      if (changedValues?.calendarList) {
        // setProjectSchedules(await getSchedules())
      }
      if (changedValues?.subscriptionList) {
        const { subscriptionList } = await getInitalSettings()
        setSubscriptionSchedules(await getSubCalendarSchedules(subscriptionList))
      }
    }, 500)
  }

  const setTodoistOptions = (todoist?: TodoistApi) => {
    if (!todoist) return
    todoist?.getProjects().then(projects => {
      setTodoistProjectOptions(projects?.map(project => ({ value: project.id, label: project.name })))
    })
    todoist?.getLabels().then(labels => {
      setTodoistLabelOptions(labels?.map(label => ({ value: label.id, label: label.name })))
    })
  }

  useEffect(() => {
    logseq.Editor.getAllPages().then(res => {
      setPageOptions(
        res?.filter(item => !item?.['journal?'])
          ?.map(item => ({
            value: item.originalName,
            label: item.originalName,
          }))
      )
    })
    const todoist = getTodoistInstance()
    setTodoistOptions(todoist)
  }, [])

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
            <Form.Item label="Ignore Tag" name="ignoreTag">
              <Select
                showSearch
                allowClear
                placeholder="Project ID (Page Name)"
                optionFilterProp="label"
                style={{ width: '300px' }}
                options={pageOptions}
                filterOption={(input, option) => (option?.label as string)?.toLowerCase()?.includes(input?.toLowerCase())}
              />
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
            <Form.Item label="Log Key" tooltip="Interstitial Journal">
              <div className="flex items-center justify-between">
                <Form.Item noStyle name={['logKey', 'id']} rules={[{ required: true }]}>
                  <Select
                    style={{ width: '240px' }}
                    options={pageOptions}
                    showSearch
                    optionFilterProp="label"
                    filterOption={(input, option) => (option?.label as string)?.toLowerCase()?.includes(input?.toLowerCase())}
                  />
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
              </div>
            </Form.Item>
            <Form.Item label="Journal" required>
              <div className="flex items-center justify-between">
                <Form.Item noStyle name={['journal', 'id']} rules={[{ required: true }]}>
                  <Input style={{ width: '240px' }} disabled />
                </Form.Item>
                <Form.Item name={['journal', 'bgColor']} noStyle rules={[{ required: true }]}>
                  <ColorPicker text="background" />
                </Form.Item>
                <Form.Item name={['journal', 'textColor']} noStyle rules={[{ required: true }]}>
                  <ColorPicker text="text" />
                </Form.Item>
                <Form.Item name={['journal', 'borderColor']} noStyle rules={[{ required: true }]}>
                  <ColorPicker text="border" />
                </Form.Item>
                <Form.Item name={['journal', 'query']} rules={[{ required: true }]} style={{ display: 'none' }}>
                  <Query calendarId='query' />
                </Form.Item>
                <Form.Item name={['journal', 'enabled']} noStyle valuePropName="checked">
                  <Switch />
                </Form.Item>
              </div>
            </Form.Item>
          </div>
          <div id="projects" className={classNames(s.formBlock, { [s.show]: tab === 'projects' })}>
            <Form.List name="projectList">
              {(fields, { add, remove, move }) => (<>
                <DragDropContext onDragEnd={(e) => {
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
                                      {/* <Input placeholder="Project ID (Page Name)" style={{ width: '300px' }} /> */}
                                      <Select
                                        showSearch
                                        placeholder="Project ID (Page Name)"
                                        optionFilterProp="label"
                                        style={{ width: '300px' }}
                                        options={pageOptions}
                                        filterOption={(input, option) => (option?.label as string)?.toLowerCase()?.includes(input?.toLowerCase())}
                                      />
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
                          <Button type="dashed" onClick={() => add(DEFAULT_PROJECT)} block icon={<PlusOutlined />}>
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
            <Alert message="Do not use this setting unless you need to write your own Query to get the calendar." type="warning" className="mb-6" />
            <Form.List name="calendarList">
              {(fields, { add, remove, move }) => (<>
                <DragDropContext onDragEnd={(e) => {
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
                                <Form.Item>
                                  <div className="flex items-center justify-between">
                                    <Form.Item name={[field.name, 'id']} noStyle rules={[{ required: true }]}>
                                      <Input placeholder="Calendar ID" style={{ width: '300px' }} />
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
                                    <MinusCircleOutlined onClick={() => remove(field.name)} />
                                  </div>
                                </Form.Item>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        <Form.Item>
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
                      <Form.Item name={[field.name, 'url']} noStyle rules={[{ required: true }]}>
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
          <div id="pomodoro" className={classNames(s.formBlock, { [s.show]: tab === 'pomodoro' })}>
            <Form.Item label="Pomodoro Length" name={['pomodoro', 'pomodoro']} rules={[{ required: true }]} labelCol={{ span: 5 }}>
              <InputNumber min={3} precision={0} addonAfter="min" />
            </Form.Item>
            <Form.Item label="Short Break Length" name={['pomodoro', 'shortBreak']} rules={[{ required: true }]} labelCol={{ span: 5 }}>
              <InputNumber min={1} precision={0} addonAfter="min" />
            </Form.Item>
            <Form.Item label="Long Break Length" name={['pomodoro', 'longBreak']} rules={[{ required: true }]} labelCol={{ span: 5 }}>
              <InputNumber min={1} precision={0} addonAfter="min" />
            </Form.Item>
            {/* <Form.Item label="Auto Start Breaks" name={['pomodoro', 'autoStartBreaks']} rules={[{ required: true }]} labelCol={{ span: 5 }}>
              <Select options={YES_NO_SELECTION} />
            </Form.Item>
            <Form.Item label="Auto Start Pomodoros" name={['pomodoro', 'autoStartPomodoros']} rules={[{ required: true }]} labelCol={{ span: 5 }}>
              <Select options={YES_NO_SELECTION} />
            </Form.Item> */}
            <Form.Item label="Long Break Interval" name={['pomodoro', 'longBreakInterval']} rules={[{ required: true }]} labelCol={{ span: 5 }}>
              <InputNumber min={1} precision={0} />
            </Form.Item>
            {
              [...new Array(5).keys()].map((i) => (
                <Form.Item
                  name={['pomodoro', 'commonPomodoros', i]}
                  label={i === 0 ? 'Common Pomodoro' : ''}
                  labelCol={{ span: 5 }}
                  {...(i === 0 ? {} : { wrapperCol: {offset: 5} })}
                >
                  <InputNumber min={1} addonAfter="min" />
                </Form.Item>
              ))
            }
          </div>
          <div id="todoist" className={classNames(s.formBlock, { [s.show]: tab === 'todoist' })}>
          <Alert message="Restart logseq after modifying the configuration, and the synchronization icon will appear in toolbar." type="info" className="mb-6" />
            <Form.Item
              label="API Token"
              name={['todoist', 'token']}
              labelCol={{ span: 8 }}
              tooltip={<Button type="link" onClick={() => logseq.App.openExternalLink('https://todoist.com/app/settings/integrations')}>Paste your todoist api token here</Button>}
            >
              <Input placeholder="Please input todoist api token"/>
            </Form.Item>
            <Form.Item label="Sync" name={['todoist', 'sync']} labelCol={{ span: 8 }}>
              <Select
                placeholder="Please select"
                options={[
                  { label: 'All Todoist Projects', value: 0 },
                  { label: 'A Specific Todoist Project', value: 1 },
                  { label: 'A Specific Todoist Filter', value: 2 },
                ]}
              />
            </Form.Item>
            <Form.Item noStyle shouldUpdate={(prev, cur) => prev.todoist?.sync !== cur.todoist?.sync}>
              {({ getFieldValue }) => {
                const sync = getFieldValue(['todoist', 'sync']);
                return (
                  <Form.Item
                    hidden={sync !== 2}
                    label="Todoist filter"
                    name={['todoist', 'filter']}
                    labelCol={{ span: 8 }}
                    tooltip={<Button type="link" onClick={() => logseq.App.openExternalLink('https://todoist.com/help/articles/205248842')}>Define a filter for sync</Button>}
                    required={sync == 2}
                    rules={[
                      {
                        required: sync == 2,
                        message: 'Please enter a filter string',
                      },
                    ]}
                  >
                    <Input placeholder="Please input a todoist filter string" />
                  </Form.Item>
                )
              }}
            </Form.Item>
            <Form.Item noStyle shouldUpdate={(prev, cur) => prev.todoist?.sync !== cur.todoist?.sync}>
              {({ getFieldValue }) => {
                const sync = getFieldValue(['todoist', 'sync'])
                return (
                  <Form.Item
                    label={sync === 0 ? 'Todoist project' : 'Todoist project for new logseq events'}
                    name={['todoist', 'project']}
                    labelCol={{ span: 8 }}
                  >
                    <Select
                      placeholder="Please select a todoist project"
                      options={todoistProjectOptions}
                      showSearch
                      allowClear
                      filterOption={(input, option) => (option?.label as string)?.toLowerCase()?.includes(input?.toLowerCase())}
                    />
                  </Form.Item>
                )
              }}
            </Form.Item>
            <Form.Item label="Todoist label for new logseq events" name={['todoist', 'label']} labelCol={{ span: 8 }}>
              <Select
                placeholder="Please select todoist label"
                options={todoistLabelOptions}
                showSearch
                allowClear
                filterOption={(input, option) => (option?.label as string)?.toLowerCase()?.includes(input?.toLowerCase())}
              />
            </Form.Item>
            <Form.Item label="Logseq block position" name={['todoist', 'position']} labelCol={{ span: 8 }}>
              <Select
                placeholder="Please select position page"
                options={pageOptions}
                allowClear
                showSearch
                optionFilterProp="label"
                filterOption={(input, option) => (option?.label as string)?.toLowerCase()?.includes(input?.toLowerCase())}
              />
            </Form.Item>
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

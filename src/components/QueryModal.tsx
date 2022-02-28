import React, { useState } from 'react'
import { Modal, Form, Select, Input, Button, Space, Switch, Row, Col } from 'antd'
import { QuestionCircleOutlined, MinusCircleOutlined, PlusOutlined, FunctionOutlined } from '@ant-design/icons'
import { ISettingsForm, ISettingsFormQuery } from '../util/util'

const QueryModal: React.FC<Partial<{
  visible: boolean
  calendarId: string
  initialValues: ISettingsFormQuery
  onCancel: () => void
  onOk: (values: ISettingsForm['calendarList'][number]['query']) => void
  [key: string]: any
}>> = ({ visible, calendarId, initialValues, onCancel, onOk, ...props }) => {

  console.log('[faiz:] === initialValues', initialValues)
  const [form] = Form.useForm<ISettingsFormQuery>()

  const onSave = () => {
    const _query = form.getFieldsValue(true)
    onOk?.(_query)
  }

  return (
    <Modal
      {...props}
      width={980}
      title={`${calendarId} Calendar Query`}
      visible={visible}
      onCancel={onCancel}
      onOk={onSave}
    >
      <div>
        <Form initialValues={initialValues} form={form}>
          <Row gutter={24}>
            <Col span={12}>
              <h3>Schedules</h3>
            </Col>
            <Col span={12}>
              <h3>Milestones</h3>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={12}>
              <Form.List name="schedule">
                {(fields, { add, remove }) => (<>
                  {fields.map((field, index) => (
                    <div className="rounded shadow-md px-4 pt-4 mb-3 relative" style={{ paddingBottom: '-24px' }}>
                      <Form.Item label={`query ${index}`} labelCol={{ span: 4 }}>
                        <Form.Item label="script" name={[field.name, 'script']} labelCol={{ span: 7 }}>
                          <Input.TextArea />
                        </Form.Item>
                        <Form.Item label="scheduleStart" name={[field.name, 'scheduleStart']} labelCol={{ span: 7 }}>
                          <Input />
                        </Form.Item>
                        <Form.Item label="scheduleEnd" name={[field.name, 'scheduleEnd']} labelCol={{ span: 7 }}>
                          <Input />
                        </Form.Item>
                        <Form.Item label="dateFormatter" name={[field.name, 'dateFormatter']} labelCol={{ span: 7 }}>
                          <Input />
                        </Form.Item>
                      </Form.Item>
                      { index !== 0 && <MinusCircleOutlined className="absolute bottom-7 left-7" onClick={() => remove(field.name)} /> }
                    </div>
                  ))}
                  <Form.Item>
                    <Button type="dashed" size="small" onClick={() => add()} block icon={<PlusOutlined />}>
                      Add Schedule Query
                    </Button>
                  </Form.Item>
                </>)}
              </Form.List>
            </Col>
            <Col span={12}>
              <Form.List name="milestone">
                  {(fields, { add, remove }) => (<>
                    {fields.map((field, index) => (
                      <div className="rounded shadow-md px-4 pt-4 mb-3" style={{ paddingBottom: '-24px' }}>
                        <Form.Item label={`query ${index}`} labelCol={{ span: 4 }}>
                          <Form.Item label="script" name={[field.name, 'script']} labelCol={{ span: 7 }}>
                            <Input.TextArea />
                          </Form.Item>
                          <Form.Item label="scheduleStart" name={[field.name, 'scheduleStart']} labelCol={{ span: 7 }}>
                            <Input />
                          </Form.Item>
                          <Form.Item label="scheduleEnd" name={[field.name, 'scheduleEnd']} labelCol={{ span: 7 }}>
                            <Input />
                          </Form.Item>
                          <Form.Item label="dateFormatter" name={[field.name, 'dateFormatter']} labelCol={{ span: 7 }}>
                            <Input />
                          </Form.Item>
                        </Form.Item>
                      </div>
                    ))}
                    <Form.Item>
                      <Button type="dashed" size="small" onClick={() => add()} block icon={<PlusOutlined />}>
                        Add Milestone Query
                      </Button>
                    </Form.Item>
                  </>)}
                </Form.List>
            </Col>
          </Row>

        </Form>
      </div>
    </Modal>
  )
}

export default QueryModal

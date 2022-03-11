import React, { useState } from 'react'
import { Modal, Form, Input, Button, Row, Col, Radio, Tooltip } from 'antd'
import { MinusCircleOutlined, PlusOutlined, PlayCircleOutlined } from '@ant-design/icons'
import { ISettingsForm, ISettingsFormQuery, log } from '../util/util'

const QueryModal: React.FC<Partial<{
  visible: boolean
  initialValues: ISettingsFormQuery[]
  onCancel: () => void
  onOk: (values: ISettingsForm['calendarList'][number]['query']) => void
  [key: string]: any
}>> = ({ visible, calendarId, initialValues, onCancel, onOk, ...props }) => {
  const [form] = Form.useForm<ISettingsFormQuery>()

  const onSave = () => {
    const _values = form.getFieldsValue(true)
    onOk?.(_values?.query)
  }

  const onClickPlay = async (index) => {
    const queryItem = form.getFieldsValue(true)?.query[index]
    if (queryItem) {
      console.log('')
      log('[faiz:] === start exec your query:\n', 'blue')
      console.log(queryItem?.script)
      try {
        const res = await logseq.DB.datascriptQuery(queryItem.script)
        log('[faiz:] === exec your query success:\n', 'green')
        console.log(res)
      } catch (error) {
        log('[faiz:] === exec your query failed:\n', 'red')
        console.error(error)
      }
      console.log('')
    }
  }

  return (
    <Modal
      {...props}
      width={980}
      title="Calendar Query"
      visible={visible}
      onCancel={onCancel}
      onOk={onSave}
    >
      <div className="overflow-y-auto overflow-x-hidden" style={{ maxHeight: '500px' }}>
        <Form initialValues={{ query: initialValues }} form={form} size="small">
          <Form.List name="query">
            {(fields, { add, remove }) => (<>
              {fields.map((field, index) => (
                <div key={index} className="rounded border-dashed border-gray-200 px-4 pt-4 mb-3 relative">
                  <Form.Item label={`Query ${index + 1}`}>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item label="script" name={[field.name, 'script']} labelCol={{ span: 4 }}>
                          <Input.TextArea rows={8} />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item label="scheduleStart" name={[field.name, 'scheduleStart']} labelCol={{ span: 7 }}>
                          <Input />
                        </Form.Item>
                        <Form.Item label="scheduleEnd" name={[field.name, 'scheduleEnd']} labelCol={{ span: 7 }}>
                          <Input />
                        </Form.Item>
                        <Form.Item label="dateFormatter" name={[field.name, 'dateFormatter']} labelCol={{ span: 7 }}>
                          <Input />
                        </Form.Item>
                        <Form.Item label="is milestone" name={[field.name, 'isMilestone']} labelCol={{ span: 7 }}>
                          <Radio.Group>
                            <Radio value={true}>yes</Radio>
                            <Radio value={false}>no</Radio>
                          </Radio.Group>
                        </Form.Item>
                      </Col>
                    </Row>
                  </Form.Item>
                  <div className="absolute bottom-4 right-4">
                    <Tooltip title="Execute this query statement in DevTools">
                      <PlayCircleOutlined onClick={() => onClickPlay(index)} />
                    </Tooltip>
                    { index !== 0 && <MinusCircleOutlined className="ml-2" onClick={() => remove(field.name)} /> }
                  </div>
                </div>
              ))}
              <Form.Item>
                <Button type="dashed" size="small" onClick={() => add()} block icon={<PlusOutlined />}>
                  Add Schedule Query
                </Button>
              </Form.Item>
            </>)}
          </Form.List>
        </Form>
      </div>
    </Modal>
  )
}

export default QueryModal

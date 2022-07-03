import { IPomodoroInfo } from '@/helper/pomodoro'
import { Button, DatePicker, Form, Input, InputNumber, Modal, Radio } from 'antd'
import dayjs from 'dayjs'
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'
import React, { useEffect, useState } from 'react'

const ModifyPomodoro: React.FC<{
  visible: boolean
  data?: IPomodoroInfo
  onCancel: () => void
  onOk: (data: IPomodoroInfo) => void
}> = ({ visible, onCancel, onOk, data }) => {
  const [form] = Form.useForm()

  useEffect(() => {
    if (data) {
      console.log('[faiz:] === modify pomodoro data', data)
      form.setFieldsValue({
        ...data,
        start: data.start ? dayjs(data.start) : dayjs(),
        length: Math.ceil(data.length / 60) || 1,
        interruptions: data.interruptions?.map(item => ({
          ...item,
          time: item.time ? dayjs(item.time) : dayjs(),
        })) || [],
      })
    }
  }, [data?.start])

  return (
    <Modal
      title="Modify Pomodoro"
      visible={visible}
      onCancel={onCancel}
      onOk={async () => {
        const values = await form.validateFields()
        onOk({
          ...values,
          start: values.start.valueOf(),
          length: values.length * 60,
          interruptions: values.interruptions?.map(item => ({
            ...item,
            time: item.time.valueOf(),
          })),
        })
      }}
    >
      <Form form={form}>
        <Form.Item name="isFull" label="Is Full" rules={[{ required: true }]}>
          <Radio.Group>
            <Radio value={true}>Full Tomato</Radio>
            <Radio value={false}>Half Tomato</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item name="start" label="Start Time" rules={[{ required: true }]}>
          <DatePicker showTime={{ format: 'HH:mm' }} format="YYYY-MM-DD HH:mm" />
        </Form.Item>
        <Form.Item name="length" label="Length" rules={[{ required: true }]}>
          <InputNumber min={1} addonAfter="min" />
        </Form.Item>
        {/* <Form.List name="interruptions">
          {(fields, { add, remove }) => (<>
            {fields.map((field, index) => (
              <Form.Item label={index === 0 ? 'Interruption' : ''} {...(index === 0 ? {} : { wrapperCol: {offset: 4} })}>
                <div className="flex items-center justify-between">
                  <Form.Item name={[field.name, 'time']} noStyle rules={[{ required: true }]}>
                    <DatePicker showTime={{ format: 'HH:mm' }} />
                  </Form.Item>
                  <Form.Item name={[field.name, 'remark']} noStyle rules={[{ required: true }]}>
                    <Input placeholder="Remark" />
                  </Form.Item>
                  <MinusCircleOutlined onClick={() => remove(field.name)} />
                </div>
              </Form.Item>
            ))}
            <Form.Item wrapperCol={{ offset: 4 }}>
              <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                Add Interruption
              </Button>
            </Form.Item>
          </>)}
        </Form.List> */}
      </Form>
    </Modal>
  )
}

export default ModifyPomodoro

import { IPomodoroInfo } from '@/helper/pomodoro'
import { DatePicker, Form, Input, InputNumber, Modal, Radio } from 'antd'
import React, { useState } from 'react'

const ModifyPomodoro: React.FC<{
  visible: boolean
  onCancel: () => void
  onOk: (data: IPomodoroInfo) => void
}> = ({ visible, onCancel, onOk }) => {
  const [form] = Form.useForm()

  return (
    <Modal
      title="Modify Pomodoro"
      visible={visible}
      onCancel={onCancel}
      onOk={async () => {
        const values = await form.validateFields()
        onOk(values)
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
          <DatePicker showTime />
        </Form.Item>
        <Form.Item name="length" label="Length" rules={[{ required: true }]}>
          <InputNumber min={1} />
        </Form.Item>
        {/* <Form.Item></Form.Item> */}
      </Form>
    </Modal>
  )
}

export default ModifyPomodoro

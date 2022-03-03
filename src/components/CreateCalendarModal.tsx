import { Form, Input, Modal } from 'antd'
import React, { useState } from 'react'

const CreateCalendarModal: React.FC<{
  visible: boolean
  onSave: (name: string) => void
  onCancel: () => void
}> = ({ visible, onCancel, onSave }) => {
  const [form] = Form.useForm()

  return (
    <Modal
      title="Create Calendar"
      visible={visible}
      onOk={() => {
        form.validateFields().then(values => {
          onSave(values.calendarId.trim())
        })
      }}
      onCancel={onCancel}
    >
      <Form form={form}>
        <Form.Item name="calendarId" label="Calendar ID" rules={[{required: true}]}>
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default CreateCalendarModal

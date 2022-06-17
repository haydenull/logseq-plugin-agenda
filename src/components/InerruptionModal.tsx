import { IInterruption } from '@/helper/pomodoro'
import { Form, Input, Modal, Radio } from 'antd'
import dayjs from 'dayjs'
import React, { useState } from 'react'

const InerruptionModal: React.FC<{
  visible: boolean
  pomodoroId: number
  uuid?: string
  onCancel: () => void
  onOk?: (info: IInterruption) => void
}> = ({ visible, pomodoroId, uuid, onCancel, onOk }) => {
  const [form] = Form.useForm()

  return (
    <Modal
      title="Record Inerruption"
      visible={visible}
      onCancel={onCancel}
      onOk={async () => {
        const values = await form.validateFields()
        const interruptions = window.interruptionMap.get(pomodoroId) || []
        window.interruptionMap.set(pomodoroId, interruptions.concat({
          type: values.type,
          remark: values.remark,
          time: dayjs().valueOf(),
        }))
        onCancel()
      }}
    >
      <Form form={form}>
        <Form.Item name="type" label="Type" initialValue={1}>
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            options={[
              { label: 'Internal', value: 1 },
              { label: 'External', value: 2 },
            ]}
          />
        </Form.Item>
        <Form.Item name="remark" label="Remark" rules={[{ required: true }]}>
          <Input maxLength={50} showCount />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default InerruptionModal

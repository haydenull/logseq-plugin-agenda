import { IInterruption } from '@/helper/pomodoro'
import { Form, Input, Modal, Radio, Tooltip } from 'antd'
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
      <Form form={form} labelCol={{ span: 4 }}>
        <Form.Item name="type" label="Type" initialValue={1} rules={[{ required: true }]}>
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            options={[
              { label: <Tooltip title="Internal interruptions are distractions that come from within, such as checking social media or looking at your phone.">Internal</Tooltip>, value: 1 },
              { label: <Tooltip title="External interruptions are distractions that come from outside, such as someone calling you or a notification on your computer.">External</Tooltip>, value: 2 },
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

import { todayTasksAtom } from '@/model/schedule'
import { Modal, Checkbox, Divider } from 'antd'
import { useAtom } from 'jotai'
import React, { useState } from 'react'

const TodayTaskModal: React.FC<{
  visible: boolean
  uuid: string
  onSave: () => void
  onCancel: () => void
}> = ({ visible, uuid, onSave, onCancel }) => {
  const [indeterminate, setIndeterminate] = useState(true)
  const [tasks] = useAtom(todayTasksAtom)

  const options = tasks.map((task) => ({
    label: task.title as string,
    value: task?.raw?.uuid as string,
  }))
  const [value, setValue] = useState<string[]>([])

  return (
    <Modal
      visible={visible}
      title="Insert Today Task"
      onCancel={onCancel}
      onOk={onSave}
    >
      <Checkbox.Group options={options} value={value} onChange={list => setValue(list as string[])} />
      <Divider />
      <Checkbox indeterminate={indeterminate} checked={options.length === value.length}>Check All</Checkbox>
    </Modal>
  )
}

export default TodayTaskModal

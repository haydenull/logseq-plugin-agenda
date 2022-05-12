import { todayTasksAtom } from '@/model/schedule'
import { Modal, Checkbox, Divider, Row, Col } from 'antd'
import { useAtom } from 'jotai'
import React, { useEffect, useState } from 'react'

const TodayTaskModal: React.FC<{
  visible: boolean
  uuid: string
  onSave: () => void
  onCancel: () => void
}> = ({ visible, uuid, onSave, onCancel }) => {
  const [indeterminate, setIndeterminate] = useState(false)
  const [tasks] = useAtom(todayTasksAtom)

  const options = tasks.map((task) => ({
    label: task.title as string,
    value: task?.id as string,
  }))
  const [value, setValue] = useState<string[]>([])

  const onClickCheckAll = () => {
    if (options.length === value.length) {
      setValue([])
    } else {
      setValue(options.map(option => option.value))
    }
  }
  const onClickOk = () => {
    // const txt = value.map((id) => {
    onSave()
  }


  useEffect(() => {
    if (value?.length > 0 && value.length < options.length) {
      setIndeterminate(true)
    } else {
      setIndeterminate(false)
    }
  }, [value?.length, options?.length])

  console.log('[faiz:] === options', options, tasks)

  return (
    <Modal
      visible={visible}
      title="Insert Today Task"
      onCancel={onCancel}
      onOk={onClickOk}
    >
      <Checkbox.Group value={value} onChange={list => setValue(list as string[])}>
        {options.map((option, index) => (
          <Row>
            <Col span={24}>
              <Checkbox key={option.value} value={option.value}>{option.label}</Checkbox>
            </Col>
          </Row>
        ))}
      </Checkbox.Group>
      <Divider />
      <Checkbox
        indeterminate={indeterminate}
        checked={options.length === value.length}
        onClick={onClickCheckAll}
      >
        Check All
      </Checkbox>
    </Modal>
  )
}

export default TodayTaskModal

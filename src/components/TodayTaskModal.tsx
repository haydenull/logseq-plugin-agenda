import type { BlockEntity } from '@logseq/libs/dist/LSPlugin.user'
import { Modal, Checkbox, Divider, Row, Col } from 'antd'
import { useAtom } from 'jotai'
import React, { useEffect, useState } from 'react'

import { todayTasksAtom } from '@/model/events'
import { fixedBlockUUID, getBlockData } from '@/util/logseq'

const TodayTaskModal: React.FC<{
  visible: boolean
  uuid: string
  onSave: () => void
  onCancel: () => void
}> = ({ visible, uuid, onSave, onCancel }) => {
  const [indeterminate, setIndeterminate] = useState(false)
  const [tasks] = useAtom(todayTasksAtom)

  const options = tasks.map((task) => ({
    label: task.addOns.showTitle,
    value: task.uuid,
  }))
  const [value, setValue] = useState<string[]>([])

  const onClickCheckAll = () => {
    if (options.length === value.length) {
      setValue([])
    } else {
      setValue(options.map((option) => option.value))
    }
  }
  const onClickOk = async () => {
    const blockUUIDList: string[] = value
    const fixedBlockPromises = blockUUIDList.map(fixedBlockUUID)
    await Promise.all(fixedBlockPromises)
    await logseq.Editor.insertBatchBlock(
      uuid,
      blockUUIDList.map((_uuid) => ({
        content: `((${_uuid}))`,
      })),
      {
        before: false,
        sibling: true,
      },
    )
    onSave()
  }

  useEffect(() => {
    if (value?.length > 0 && value.length < options.length) {
      setIndeterminate(true)
    } else {
      setIndeterminate(false)
    }
  }, [value?.length, options?.length])

  return (
    <Modal open={visible} title="Insert Today Task" onCancel={onCancel} onOk={onClickOk}>
      <Checkbox.Group value={value} onChange={(list) => setValue(list as string[])}>
        <div className="flex flex-col gap-1">
          {options.map((option) => (
            <Checkbox key={option.value} value={option.value}>
              {option.label}
            </Checkbox>
          ))}
        </div>
      </Checkbox.Group>
      <Divider />
      <Checkbox indeterminate={indeterminate} checked={options.length === value.length} onClick={onClickCheckAll}>
        Check All
      </Checkbox>
    </Modal>
  )
}

export default TodayTaskModal

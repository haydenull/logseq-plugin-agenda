import React, { useEffect, useState } from 'react'

import { Modal, Input } from 'antd'
import { copyToClipboard, getWeekly } from '../util/util'

const Weekly: React.FC<{
  visible: boolean
  onCancel: () => void
  start?: string
  end?: string
  [key: string]: any
}> = ({ visible, onCancel, start, end, ...props }) => {
  const [content, setContent] = useState<string>()

  useEffect(() => {
    if (start && end) {
      getWeekly(start, end)
        .then((logs) => {
          setContent(logs?.map(log => log.content)?.join('\n\n'))
        })
    }
  }, [start, end])

  return (
    <Modal
      {...props}
      destroyOnClose
      title="Weekly Logs"
      okText="Copy And Close"
      visible={visible}
      onCancel={onCancel}
      onOk={() => {
        copyToClipboard(content || '')
        onCancel()
      }}
    >
      <Input.TextArea value={content} onChange={e => setContent(e.target.value)} rows={10} />
    </Modal>
  )
}

export default Weekly

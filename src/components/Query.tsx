import React, { useState } from 'react'
import { Button } from 'antd'
import { QuestionCircleOutlined, MinusCircleOutlined, PlusOutlined, FunctionOutlined } from '@ant-design/icons'
import QueryModal from './QueryModal'

const Query: React.FC<{
  value?: number
  onChange?: (value: number) => void
}> = ({ value, onChange }) => {
  const [visible, setVisible] = useState(false)

  return (
    <div>
      <Button type="link" icon={<FunctionOutlined />} onClick={() => setVisible(true)} />
      <QueryModal
        visible={visible}
      />
    </div>
  )
}

export default Query

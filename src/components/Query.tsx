import React, { useState } from 'react'
import { Button, Tooltip } from 'antd'
import { FunctionOutlined } from '@ant-design/icons'
import QueryModal from './QueryModal'
import { ISettingsFormQuery } from '../util/util'

const Query: React.FC<{
  value?: ISettingsFormQuery[]
  onChange?: (values: ISettingsFormQuery[]) => void
  calendarId?: string
}> = ({ value, onChange, calendarId }) => {
  const [visible, setVisible] = useState(false)

  return (
    <div>
      <Tooltip title="Edit Calendar Queries">
        <Button type="link" icon={<FunctionOutlined />} onClick={() => setVisible(true)} />
      </Tooltip>
      <QueryModal
        visible={visible}
        calendarId={calendarId}
        initialValues={value}
        onCancel={() => setVisible(false)}
        onOk={(values) => {
          onChange?.(values)
          setVisible(false)
        }}
      />
    </div>
  )
}

export default Query

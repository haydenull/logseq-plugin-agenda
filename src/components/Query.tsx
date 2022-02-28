import React, { useState } from 'react'
import { Modal, Form, Select, Input, Button, Space, Switch } from 'antd'
import { ISettingsForm, ISettingsFormQuery } from '../util/util'

const Query: React.FC<{
  visible: boolean
  calendarId: string
  initialValues: ISettingsFormQuery
  onCancel: () => void
  onOk: (values: ISettingsForm['calendarList'][number]['query']) => void
  [key: string]: any
}> = ({ visible, calendarId, initialValues, onCancel, onOk, ...props }) => {

  const onSave = () => {}

  return (
    <Modal
      {...props}
      title={`${calendarId} Query`}
      visible={visible}
      onCancel={onCancel}
      onOk={onSave}
    >
      
    </Modal>
  )
}

export default Query

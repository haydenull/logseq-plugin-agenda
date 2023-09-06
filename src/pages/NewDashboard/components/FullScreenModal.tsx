import { CloseOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import React, { useState } from 'react'

const FullScreenModal = ({ open, children }: { open: boolean; children: React.ReactNode }) => {
  if (!open) return null
  return (
    <div className="w-screen h-screen fixed top-0 left-0 z-50">
      {children}
      <Button shape="circle" icon={<CloseOutlined />}></Button>
    </div>
  )
}

export default FullScreenModal

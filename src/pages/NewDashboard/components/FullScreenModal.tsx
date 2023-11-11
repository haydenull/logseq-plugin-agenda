import { CloseOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import React, { useState } from 'react'
import { createPortal } from 'react-dom'

const FullScreenModal = ({
  open,
  children,
  onClose,
}: {
  open: boolean
  children: React.ReactNode
  onClose?: () => void
}) => {
  if (!open) return null
  return createPortal(
    <div className="w-screen h-screen fixed top-0 left-0 z-50 bg-gray-100">
      {children}
      <div className="absolute right-2 top-2">
        <Button icon={<CloseOutlined />} onClick={onClose}>
          Exit
        </Button>
      </div>
    </div>,
    document.body,
  )
}

export default FullScreenModal

import { CloseOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import React, { useState } from 'react'
import { createPortal } from 'react-dom'

import { cn } from '@/util/util'

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
    <div
      className={cn('w-screen h-screen fixed top-0 left-0 z-50 bg-gray-50', {
        'pt-[30px]': import.meta.env.VITE_MODE === 'plugin',
      })}
    >
      {children}
      <div className={cn('absolute right-2', import.meta.env.VITE_MODE === 'plugin' ? 'top-[38px]' : 'top-2')}>
        <Button icon={<CloseOutlined />} onClick={onClose}>
          Exit
        </Button>
      </div>
    </div>,
    document.body,
  )
}

export default FullScreenModal

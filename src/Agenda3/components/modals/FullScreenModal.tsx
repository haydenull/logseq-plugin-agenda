import { CloseOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

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
  const { t } = useTranslation()
  if (!open) return null
  return createPortal(
    <div
      className={cn('fixed top-0 left-0 z-50 h-screen w-screen bg-gray-50', {
        'pt-[30px]': import.meta.env.VITE_MODE === 'plugin',
      })}
    >
      {children}
      <div className={cn('absolute right-2', import.meta.env.VITE_MODE === 'plugin' ? 'top-[34px]' : 'top-1')}>
        <Button icon={<CloseOutlined />} onClick={onClose}>
          {t('Exit')}
        </Button>
      </div>
    </div>,
    document.body,
  )
}

export default FullScreenModal

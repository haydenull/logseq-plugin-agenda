import { type Dayjs } from 'dayjs'
import React, { useState } from 'react'

import FullScreenModal from '../modals/FullScreenModal'
import TimeBoxActual from './TimeBoxActual'

const DailyReview = ({
  children,
  open,
  date,
  onCancel,
}: {
  open: boolean
  date: Dayjs
  onCancel: () => void
  children: React.ReactNode
}) => {
  return (
    <FullScreenModal open={open}>
      <div className="w-screen h-screen">
        <TimeBoxActual date={date} />
      </div>
    </FullScreenModal>
  )
}

export default DailyReview

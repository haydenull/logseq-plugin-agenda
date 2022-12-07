import React from 'react'

const Checkbox: React.FC<{
  checked?: boolean
  markColor?: string
  bgColor?: string
  indeterminate?: boolean
  onChange?: (checked: boolean) => void
  [props: string]: any
}> = ({ checked, markColor, bgColor, indeterminate, onChange, children, ...props }) => {
  // TODO: add indeterminate state
  return (
    <div onClick={() => onChange?.(!checked)} {...props}>
      <span className={`check-box mr-2 ${checked ? 'checked' : ''}`} style={{ backgroundColor: bgColor }}>
        <span style={{ borderColor: markColor }}></span>
      </span>
      {children}
    </div>
  )
}

export default Checkbox

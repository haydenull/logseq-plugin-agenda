import React from 'react'

const Checkbox: React.FC<{
  checked?: boolean
  color?: string
  indeterminate?: boolean
  onChange?: (checked: boolean) => void
  [props: string]: any
}> = ({ checked, color, indeterminate, onChange, children, ...props }) => {
  // TODO: add indeterminate state
  return (
    <div onClick={() => onChange?.(!checked)} {...props}>
      <span className={`check-box mr-2 ${checked ? 'checked' : ''}`} style={{ backgroundColor: color }}></span>
      {children}
    </div>
  )
}

export default Checkbox

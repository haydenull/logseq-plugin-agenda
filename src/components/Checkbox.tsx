import React from 'react'

const Checkbox: React.FC<{
  checked?: boolean
  color?: string
  onChange?: (checked: boolean) => void
  [props: string]: any
}> = ({ checked, color, onChange, children, ...props }) => {
  return (
    <div onClick={() => onChange?.(!checked)} {...props}>
      <span className={`check-box mr-2 ${checked ? 'checked' : ''}`} style={{ backgroundColor: color }}></span>
      {children}
    </div>
  )
}

export default Checkbox

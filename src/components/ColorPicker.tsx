import classNames from 'classnames'
import React, { useEffect, useRef, useState } from 'react'
import { SketchPicker } from 'react-color'

const safeHeight = 350
const presetColors = [
  '#ad1357', '#d81b60', '#d50001', '#e67c73',
  '#f4511e', '#ef6c00', '#f09300', '#f6bf25',
  '#e4c442', '#c0ca33', '#7cb342', '#33b679',
  '#0a8043', '#009688', '#049be5', '#4285f4',
  '#4050b5', '#7886cb', '#b39ddb', '#9e69af',
  '#8e24aa', '#795648', '#616161', '#a79b8e',
  '#333333', '#000000', '#ffffff',
]

const ColorPicker: React.FC<{
  text: string
  value?: string
  onChange?: (color: string) => void
}> = ({ value, onChange, text }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [pickerVisible, setPickerVisible] = useState(false)
  const [position, setPosition] = useState<'top' | 'bottom'>('top')

  const onChangeColor = (color: any) => {
    const rgba = color.rgb
    const _color = `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`
    onChange?.(_color)
  }

  useEffect(() => {
    if (pickerVisible && containerRef) {
      const rect = containerRef.current?.getBoundingClientRect()
      if ((rect?.top || 0) < safeHeight) {
        setPosition('bottom')
      } else {
        setPosition('top')
      }
    }
  }, [pickerVisible])

  return (
    <div ref={containerRef}>
      <div className="flex items-center cursor-pointer" onClick={() => setPickerVisible(true)}>
        {text + ': '}
        <span style={{ backgroundColor: value, boxShadow: 'inset 0px 0px 1px var(--ls-title-text-color)' }} className="rounded w-4 h-4 ml-1"></span>
      </div>
      {pickerVisible && (
        <>
          <div className="bg-transparent fixed top-0 left-0 w-screen h-screen" style={{ zIndex: 9 }} onClick={() => setPickerVisible(false)}></div>
          <div className={classNames('fixed z-10 mt-2')} style={{ transform: position === 'top' ? 'translateY(-380px)' : 'translateY(0)' }}>
            <SketchPicker color={value} onChange={onChangeColor} disableAlpha presetColors={presetColors} />
          </div>
        </>
      )}
    </div>
  )
}

export default ColorPicker

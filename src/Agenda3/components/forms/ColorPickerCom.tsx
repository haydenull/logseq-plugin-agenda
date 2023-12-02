import { Button, ColorPicker } from 'antd'
import type { Color } from 'antd/es/color-picker'

import { BACKGROUND_COLOR } from '@/constants/agenda'

const ColorPickerCom = ({ value, onChange }: { value?: string; onChange?: (value: string) => void }) => {
  // const [color, setColor] = useState<Color | string>(BACKGROUND_COLOR[DEFAULT_BG_COLOR_NAME])

  // const bgColor = useMemo<string>(() => (typeof color === 'string' ? color : color.toHexString()), [color])

  const btnStyle: React.CSSProperties = {
    backgroundColor: value,
  }

  return (
    <ColorPicker
      disabledAlpha
      presets={[{ label: 'Recommend', colors: Object.values(BACKGROUND_COLOR) }]}
      value={value}
      onChange={(color, hex) => {
        onChange?.(hex)
      }}
    >
      <Button block type="primary" style={btnStyle}>
        Agenda
      </Button>
    </ColorPicker>
  )
}

export default ColorPickerCom

import dayjs, { type Dayjs } from 'dayjs'
import { useTranslation } from 'react-i18next'
import { GiSofa } from 'react-icons/gi'
import { IoToday } from 'react-icons/io5'
import { MdToday, MdWbSunny } from 'react-icons/md'
import { PiNumberSquareSevenFill } from 'react-icons/pi'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const buttons = [
  { key: 'Today', label: 'Today', icon: <IoToday /> },
  { key: 'Tomorrow', label: 'Tomorrow', icon: <MdWbSunny /> },
  { key: 'Weekend', label: 'Weekend', icon: <GiSofa /> },
  { key: 'Next Week', label: 'Next Week', icon: <PiNumberSquareSevenFill /> },
] as const

const DateShortcutBar = ({ onSelect }: { onSelect: (value: Dayjs) => void }) => {
  const { t } = useTranslation()

  const onClick = (key: (typeof buttons)[number]['key']) => {
    const today = dayjs()
    const day = today.day()
    let value: Dayjs
    switch (key) {
      case 'Today':
        value = today
        break
      case 'Tomorrow':
        value = today.add(1, 'day')
        break
      case 'Weekend':
        // recent weekend
        if (day === 0 || day === 6) {
          value = today
        } else {
          value = today.add(6 - day, 'day')
        }
        break
      case 'Next Week':
        value = today.add(7, 'day')
        break
      default:
        return
    }
    onSelect(value)
  }

  return (
    <div className="flex justify-between">
      {buttons.map((button) => (
        <TooltipProvider key={button.key}>
          <Tooltip>
            <TooltipTrigger>
              <div
                className="w-7 h-7 hover:bg-slate-300 flex justify-center items-center rounded text-gray-400 hover:text-gray-600 text-xl"
                onClick={() => onClick(button.key)}
              >
                {button.icon}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t(button.label)}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  )
}

export default DateShortcutBar

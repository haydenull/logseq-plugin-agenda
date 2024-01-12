// 目标选择器
// 依据传入的日期筛选出该日期所属的周以及月的所有目标以供选择
// 选择后将目标id传入父组件
import { Select } from 'antd'
import type { Dayjs } from 'dayjs'
import { useAtomValue } from 'jotai'

import { agendaObjectivesAtom } from '@/Agenda3/models/entities/objectives'

const ObjectiveSelect = ({
  date,
  value,
  onChange,
}: {
  date: Dayjs
  value?: string
  onChange: (id: string) => void
}) => {
  const allObjectives = useAtomValue(agendaObjectivesAtom)

  const weekNumber = date.isoWeek()
  const monthNumber = date.month() + 1
  const yearNumber = date.year()

  const objectives = allObjectives.filter((o) => {
    const { type, number, year } = o.objective
    return (
      (type === 'week' && number === weekNumber && year === yearNumber) ||
      (type === 'month' && number === monthNumber && year === yearNumber)
    )
  })
  console.log(objectives, weekNumber, monthNumber, yearNumber, date.format('YYYY-MM-DD'))

  return (
    <Select
      bordered={false}
      suffixIcon={null}
      placeholder="Select objective"
      options={objectives.map((o) => ({
        label: o.title,
        value: o.id,
      }))}
      value={value}
      onChange={onChange}
    />
  )
}

export default ObjectiveSelect

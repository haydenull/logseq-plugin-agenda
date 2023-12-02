import { Select } from 'antd'

import usePages from '@/Agenda3/hooks/usePages'

const PageSelect = ({
  value,
  onChange,
  showPageColor = true,
}: {
  value?: string
  onChange?: (value: string) => void
  showPageColor?: boolean
}) => {
  const { allPages: pages } = usePages()

  return (
    <Select
      showSearch
      allowClear
      placeholder="Select a page"
      bordered={false}
      suffixIcon={null}
      value={value}
      onChange={onChange}
      style={{ width: '300px' }}
      optionFilterProp="label"
      filterOption={(input, option) => (option?.label as string)?.toLowerCase()?.includes(input?.toLowerCase())}
    >
      {pages.map((project) => (
        <Select.Option key={project.id} value={project.id} label={project.originalName}>
          <div className="flex flex-row items-center gap-1">
            {showPageColor ? (
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: project.bgColor }}></span>
            ) : null}
            {project.originalName}
          </div>
        </Select.Option>
      ))}
    </Select>
  )
}

export default PageSelect

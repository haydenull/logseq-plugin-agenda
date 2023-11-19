import { Select } from 'antd'

import useNewProjects from '@/hooks/useNewProjects'

const PageSelect = ({ value, onChange }: { value?: string; onChange?: (value: string) => void }) => {
  const { favoriteProjects, normalProjects, journalProjects } = useNewProjects()
  const projects = [...favoriteProjects, ...normalProjects, ...journalProjects]
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
      {projects.map((project) => (
        <Select.Option key={project.id} value={project.id} label={project.originalName}>
          <div className="flex flex-row items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: project.bgColor }}></span>
            {project.originalName}
          </div>
        </Select.Option>
      ))}
    </Select>
  )
}

export default PageSelect

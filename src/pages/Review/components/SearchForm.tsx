import { getInitialSettings } from '@/util/baseInfo'
import { Button, Checkbox, DatePicker, Form, Select } from 'antd'
import dayjs, { Dayjs } from 'dayjs'
import React, { useEffect, useState } from 'react'

const STATUS_OPTIONS = [
  { value: 'todo', label: 'todo' },
  { value: 'doing', label: 'doing' },
  { value: 'done', label: 'done' },
  { value: 'waiting', label: 'waiting' },
  { value: 'canceled', label: 'canceled' },
  // { value: 'overdue', label: 'overdue' },
]

export type IReviewSearchForm = {
  timeframe?: [Dayjs, Dayjs],
  status?: string[],
  project?: string[],
}
const SearchForm: React.FC<{
  initialValues?: IReviewSearchForm
  onSearch: (params: IReviewSearchForm) => void,
}> = ({ onSearch, initialValues }) => {
  const [form] = Form.useForm()
  const { projectList = [], weekStartDay } = getInitialSettings()
  const [pageOptions, setPageOptions] = useState<any>([])
  // const pageOptions = [{value: 'journal', label: 'Journal'}].concat(projectList.map(p => ({ value: p.id, label: p.id })))

  const onClickSearch = () => {
    form.validateFields().then(values => {
      onSearch(values)
    })
  }

  useEffect(() => {
    logseq.Editor.getAllPages().then(res => {
      const allPages = res
        ?.filter(item => !item?.['journal?'])
        ?.map(item => ({
          value: item.originalName,
          label: item.originalName,
        }))
      setPageOptions([{value: 'journal', label: 'Journal'}].concat(allPages || []))
    })
  }, [])

  return (
    <Form form={form} initialValues={initialValues} layout="inline" className="mb-6">
      <Form.Item label="Timeframe" name="timeframe">
        {/* @ts-ignore */}
        <DatePicker.RangePicker
          allowClear
          ranges={{
            Today: [dayjs(), dayjs()],
            'This Week': [dayjs().weekday(0), dayjs().weekday(6)],
            'Last Week': [dayjs().weekday(-7), dayjs().weekday(-1)],
            'This Month': [dayjs().startOf('month'), dayjs().endOf('month')],
            'Last Month': [dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')],
          }}
        />
      </Form.Item>
      <Form.Item label="Status" name="status">
        <Select options={STATUS_OPTIONS} mode="multiple" placeholder="Please select" style={{ minWidth: '100px' }} allowClear />
      </Form.Item>
      <Form.Item label="Project" name="project">
        <Select
          showSearch
          allowClear
          mode="multiple"
          placeholder="Project ID (Page Name)"
          optionFilterProp="label"
          style={{ minWidth: '240px' }}
          options={pageOptions}
          filterOption={(input, option) => (option?.label as string)?.toLowerCase()?.includes(input?.toLowerCase())}
        />
      </Form.Item>
      <Form.Item>
        <Button type="primary" onClick={() => onClickSearch()}>Review</Button>
      </Form.Item>
    </Form>
  )
}

export default SearchForm

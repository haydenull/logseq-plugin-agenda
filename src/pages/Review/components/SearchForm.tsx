import { getInitalSettings } from '@/util/baseInfo'
import { Button, Checkbox, DatePicker, Form, Select } from 'antd'
import dayjs, { Dayjs } from 'dayjs'
import React, { useState } from 'react'

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
  onSearch: (params: IReviewSearchForm) => void,
}> = ({ onSearch }) => {
  const [form] = Form.useForm()
  const { projectList = [] } = getInitalSettings()
  const pageOptions = [{value: 'journal', label: 'Journal'}].concat(projectList.map(p => ({ value: p.id, label: p.id })))

  const onClickSearch = () => {
    form.validateFields().then(values => {
      onSearch(values)
    })
  }

  return (
    <Form form={form} layout="inline" className="mb-6">
      <Form.Item label="Timeframe" name="timeframe">
        {/* @ts-ignore */}
        <DatePicker.RangePicker
          allowClear
          ranges={{
            Today: [dayjs(), dayjs()],
            'This Week': [dayjs().startOf('week'), dayjs().endOf('week')],
          }}
        />
      </Form.Item>
      <Form.Item label="Status" name="status">
        <Select options={STATUS_OPTIONS} mode="multiple" placeholder="Please select" style={{ minWidth: '100px' }} allowClear />
      </Form.Item>
      <Form.Item label="Project" name="project">
        <Select options={pageOptions} mode="multiple" placeholder="Please select" style={{ minWidth: '240px' }} allowClear />
      </Form.Item>
      <Form.Item>
        <Button type="primary" onClick={() => onClickSearch()}>Review</Button>
      </Form.Item>
    </Form>
  )
}

export default SearchForm

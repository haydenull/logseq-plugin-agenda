import { getInitalSettings } from '@/util/baseInfo'
import { Button, Checkbox, DatePicker, Form } from 'antd'
import dayjs, { Dayjs } from 'dayjs'
import React, { useState } from 'react'

const STATUS_OPTIONS = [
  { value: 'todo', label: 'todo' },
  { value: 'doing', label: 'doing' },
  { value: 'done', label: 'done' },
  { value: 'waitting', label: 'waitting' },
  { value: 'canceled', label: 'canceled' },
  { value: 'overdue', label: 'overdue' },
]

export type IReviewSearchForm = {
  dateRange: [Dayjs, Dayjs],
  status: string[],
  page: string[],
}
const SearchForm: React.FC<{
  onSearch: (params: IReviewSearchForm) => void,
}> = ({ onSearch }) => {
  const [form] = Form.useForm()
  const { projectList = [] } = getInitalSettings()
  const pageOptions = [{value: 'journal', label: 'Journal'}].concat(projectList.map(p => ({ value: p.id, label: p.id })), { value: 'restPage', label: 'Rest page' })

  const onClickSearch = () => {
    form.validateFields().then(values => {
      onSearch(values)
    })
  }

  return (
    <Form form={form}>
      <Form.Item label="Date Range" name="dateRange">
        {/* @ts-ignore */}
        <DatePicker.RangePicker
          ranges={{
            Today: [dayjs(), dayjs()],
            'This Week': [dayjs().startOf('week'), dayjs().endOf('week')],
          }}
        />
      </Form.Item>
      <Form.Item label="Status" name="status">
        <Checkbox.Group options={STATUS_OPTIONS} />
      </Form.Item>
      <Form.Item label="Page" name="page">
        <Checkbox.Group options={pageOptions} />
      </Form.Item>
      <Form.Item>
        <Button type="primary" onClick={() => onClickSearch()}>Review</Button>
      </Form.Item>
    </Form>
  )
}

export default SearchForm

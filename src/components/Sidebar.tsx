import React, { useState } from 'react'
import { Collapse, Tooltip, Typography } from 'antd'
import { DownOutlined } from '@ant-design/icons'
import Checkbox from './Checkbox'
import { ICustomCalendar } from '../util/type'

const Sidebar: React.FC<{
  onShowCalendarChange?: (showCalendar: string[]) => void
  calendarList?: ICustomCalendar[]
  subscriptionList?: ICustomCalendar[]
}> = ({ onShowCalendarChange, calendarList = [], subscriptionList = [] }) => {
  const [collapseActiveKeys, setCollapseActiveKeys] = useState<string[]>(['calendar', 'subscription'])

  const [checkedCalendarList, setCheckedCalendarList] = useState<string[]>(calendarList.map(calendar => calendar.id)?.concat(subscriptionList?.map(subscription => subscription.id)))

  const onCheck = (checkedCalendarId: string, checked: boolean) => {
    let newCheckedCalendarList = checkedCalendarList.filter(calendarId => calendarId !== checkedCalendarId)
    if (checked) {
      newCheckedCalendarList = checkedCalendarList.concat(checkedCalendarId)
    }
    setCheckedCalendarList(newCheckedCalendarList)
    onShowCalendarChange?.(newCheckedCalendarList)
  }
  const renderCollapsePanelHeader = (title: string) => {
    return <span className="text text-xs">{title}</span>
  }

  return (
    <div className="sidebar pt-2 bg-quaternary">
      <Collapse
        ghost
        expandIconPosition="right"
        activeKey={collapseActiveKeys}
        expandIcon={({ isActive }) => <span className="opacity-50"><DownOutlined rotate={isActive ? 0 : -90} /></span>}
        onChange={key => setCollapseActiveKeys(typeof key === 'string' ? [key] : key)}
      >
        <Collapse.Panel header={renderCollapsePanelHeader('Calendar')} key="calendar">
            {
              calendarList.map(calendar => (
                <Checkbox
                  className="mb-1 cursor-pointer flex items-center"
                  key={calendar.id}
                  color={calendar.bgColor}
                  checked={checkedCalendarList?.includes(calendar.id)}
                  onChange={(checked) => onCheck(calendar.id, checked)}
                >
                  <Tooltip title={calendar.id} placement="right">
                    <span className="singlge-line-ellipsis flex-1">{calendar.id}</span>
                  </Tooltip>
                </Checkbox>
              ))
            }
        </Collapse.Panel>
        {
          subscriptionList?.length > 0 && (
            <Collapse.Panel header={renderCollapsePanelHeader('Subscription')} key="subscription" className="mt-3">
              {
                subscriptionList.map(subscription => (
                  <Checkbox
                    className="mb-1 cursor-pointer flex items-center"
                    key={subscription.id}
                    color={subscription.bgColor}
                    checked={checkedCalendarList?.includes(subscription.id)}
                    onChange={(checked) => onCheck(subscription.id, checked)}
                  >
                    <Tooltip title={subscription.id} placement="right">
                      <span className="singlge-line-ellipsis flex-1">{subscription.id}</span>
                    </Tooltip>
                  </Checkbox>
                ))
              }
            </Collapse.Panel>
          )
        }
      </Collapse>
    </div>
  )
}

export default Sidebar

import React, { useState } from 'react'
import { Collapse } from 'antd'
import { getInitalSettings } from '../util/baseInfo'

const Sidebar: React.FC<{}> = () => {
  const { calendarList, subscriptionList } = getInitalSettings()

  return (
    <div>
      <Collapse>
        <Collapse.Panel header="Calendar" key="1">
          {
            calendarList?.filter(calendar => calendar.enabled).map(calendar => (
              <div key={calendar.id}>{calendar.id}</div>
            ))
          }
        </Collapse.Panel>
        <Collapse.Panel header="Subscription" key="2">
          {
            subscriptionList?.filter(subscription => subscription.enabled).map(subscription => (
              <div key={subscription.id}>{subscription.id}</div>
            ))
          }
        </Collapse.Panel>
      </Collapse>
    </div>
  )
}

export default Sidebar

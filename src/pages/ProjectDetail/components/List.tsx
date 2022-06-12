import { IEvent } from '@/util/events'
import { pureTaskBlockContent } from '@/util/logseq'
import { BlockEntity } from '@logseq/libs/dist/LSPlugin'
import { Collapse, List } from 'antd'
import classNames from 'classnames'
import dayjs from 'dayjs'
import { ISchedule } from 'tui-calendar'
import s from '../index.module.less'

const ListCom: React.FC<{
  upcomingList: IEvent[]
  waitingList: IEvent[]
  doneList: IEvent[]
  canceledList: IEvent[]
  onSelect: (task: IEvent) => void
  value?: string
}> = ({ upcomingList, waitingList, doneList, canceledList, onSelect, value }) => {

  const renderListItem =(item: IEvent) => (
    <List.Item onClick={() => onSelect(item)} className={classNames('cursor-pointer px-2 rounded', {'bg-quinary': item.id + '' === value})}>
      <div className="flex justify-between w-full">
        <span>{item.addOns.showTitle}</span>
        {
          item.rawTime && (
            <span className={classNames(s.linkText, 'whitespace-nowrap')}>{dayjs(item.addOns.start).format('MM-DD')}</span>
          )
        }
      </div>
    </List.Item>
  )

  return (
    <div className="w-full h-full">
      <Collapse ghost defaultActiveKey={['upcoming', 'waiting']}>
        <Collapse.Panel header={<span><b>Upcoming</b><span className="ml-2 description-text">{upcomingList.length}</span></span>} key="upcoming">
          <List
            dataSource={upcomingList}
            renderItem={renderListItem}
          />
        </Collapse.Panel>
        <Collapse.Panel header={<span><b>Waiting</b><span className="ml-2 description-text">{waitingList.length}</span></span>} key="upcoming">
          <List
            dataSource={waitingList}
            renderItem={renderListItem}
          />
        </Collapse.Panel>
        <Collapse.Panel header={<span><b>Done</b><span className="ml-2 description-text">{doneList.length}</span></span>} key="done">
          <List
            dataSource={doneList}
            renderItem={renderListItem}
          />
        </Collapse.Panel>
        <Collapse.Panel header={<span><b>Canceled</b><span className="ml-2 description-text">{canceledList.length}</span></span>} key="canceled">
          <List
            dataSource={canceledList}
            renderItem={renderListItem}
          />
        </Collapse.Panel>
      </Collapse>
    </div>
  )
}

export default ListCom

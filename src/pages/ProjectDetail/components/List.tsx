import { pureTaskBlockContent } from '@/util/logseq'
import { BlockEntity } from '@logseq/libs/dist/LSPlugin'
import { Collapse, List } from 'antd'
import classNames from 'classnames'
import dayjs from 'dayjs'
import { ISchedule } from 'tui-calendar'
import s from '../index.module.less'

export type ITask = BlockEntity | ISchedule
const ListCom: React.FC<{
  upcomingList: ITask[]
  doneList: ITask[]
  canceledList: ITask[]
  onSelect: (task: ITask) => void
  value?: string
}> = ({ upcomingList, doneList, canceledList, onSelect, value }) => {

  const renderListItem =(item: ITask) => (
    <List.Item onClick={() => onSelect(item)} className={classNames('cursor-pointer px-2 rounded', {'bg-quinary': item.id + '' === value})}>
      {
        item?.calendarId
        ? (
          <div className="flex justify-between w-full">
            <span>{item.title}</span>
            <span className={classNames(s.linkText, 'whitespace-nowrap')}>{dayjs(item.start).format('MM-DD')}</span>
          </div>
        )
        : pureTaskBlockContent(item as BlockEntity)
      }
    </List.Item>
  )

  return (
    <div className="w-full h-full">
      <Collapse ghost defaultActiveKey={['upcoming', 'done']}>
        <Collapse.Panel header={<span><b>Upcoming</b><span className="ml-2 description-text">{upcomingList.length}</span></span>} key="upcoming">
          <List
            dataSource={upcomingList}
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

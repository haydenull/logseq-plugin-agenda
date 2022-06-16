import { IEvent } from '@/util/events'
import { Button, Modal, Table } from 'antd'
import dayjs from 'dayjs'

const PomodoroModal: React.FC<{
  data: IEvent
  visible: boolean
  onOk: () => void
  onCancel: () => void
}> = ({ data, onCancel, onOk, visible }) => {
  return (
    <Modal
      title="Pomodoro"
      okText="Save"
      visible={visible}
      onCancel={onCancel}
      onOk={onOk}
    >
      <Table
        dataSource={data?.addOns.pomodoros}
        columns={[
          { title: 'Full Tomato', dataIndex: 'isFull', render(value, record, index) {
            return value ? '✓' : '✗'
          }, },
          { title: 'Start', dataIndex: 'start', render: (value) => dayjs(value).format('YYYY-MM-DD HH:mm') },
          { title: 'Length', dataIndex: 'length', render: value => `${value / 60} min` },
          {
            title: 'Operation',
            dataIndex: 'operation',
            render: (value, record, index) => {
              return (
                <Button type="link">Edit</Button>
              )
            }
          }
        ]}
      />
    </Modal>
  )
}

export default PomodoroModal

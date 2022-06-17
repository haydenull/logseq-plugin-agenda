import { updatePomodoroInfo } from '@/helper/pomodoro'
import { IEvent } from '@/util/events'
import { Button, Descriptions, Modal, Table, Tag } from 'antd'
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
      width="600px"
      visible={visible}
      onCancel={onCancel}
      onOk={async () => {
        // const newContent = await updatePomodoroInfo(data.uuid, {
        //   isFull: false,
        //   start: startTimeRef.current!,
        //   length: pomodoroLength - timer,
        // })
        // if (newContent) logseq.Editor.updateBlock(uuid, newContent)
      }}
    >
      <Table
        pagination={false}
        dataSource={data?.addOns.pomodoros}
        columns={[
          { title: 'Full Tomato', dataIndex: 'isFull', render(value, record, index) {
            return value ? '✅' : '❌'
          }, },
          { title: 'Start', dataIndex: 'start', width: '200px', render: (value) => dayjs(value).format('YYYY-MM-DD HH:mm') },
          { title: 'Length', dataIndex: 'length', render: value => `${Math.ceil(value / 60)} min` },
          Table.EXPAND_COLUMN,
          {
            title: 'Interruption',
            dataIndex: 'interruptions',
            render: (value, record, index) => value?.length || 0,
          },
          {
            title: 'Action',
            dataIndex: 'operation',
            render: (value, record, index) => {
              return (
                <Button type="link">Edit</Button>
              )
            }
          }
        ]}
        expandable={{
          rowExpandable: record => Boolean(record?.interruptions?.length),
          expandedRowRender: record => (
            <Table
              size="small"
              dataSource={record.interruptions}
              pagination={false}
              columns={[
                { title: 'Type', dataIndex: 'type', render: value => (value === 1 ? <Tag color="green">Internal</Tag> : <Tag color="magenta">External</Tag>) },
                { title: 'Time', dataIndex: 'time', render: value => dayjs(value).format('YYYY-MM-DD HH:mm') },
                { title: 'Remark', dataIndex: 'remark' },
              ]}
            />
          ),
        }}
        summary={(currentData) => {
          if (!currentData?.length) return null
          return (
            <>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0}>
                  Total
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1} colSpan={3}>
                  {Math.ceil(currentData!.reduce((acc, cur) => acc + cur.length, 0) / 60)} min
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4} colSpan={2}>
                  {currentData!.reduce((acc, cur) => acc + (cur.interruptions?.length || 0), 0)}
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </>
          )
        }}
      />
    </Modal>
  )
}

export default PomodoroModal

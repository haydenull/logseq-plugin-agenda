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
      width="1000px"
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
          {
            title: 'Interruption',
            dataIndex: 'interruptions',
            render: (value, record, index) => {
              if (!value?.length) return '-'
              return (
                <Descriptions>
                  {
                    value.map((interruption, index) => {
                      return <>
                        <Descriptions.Item label="Type">{ interruption.type === 1 ? <Tag color="green">Internal</Tag> : <Tag color="magenta">External</Tag> }</Descriptions.Item>
                        <Descriptions.Item label="Time">{dayjs(interruption.time).format('HH:mm')}</Descriptions.Item>
                        <Descriptions.Item label="Reason">{interruption.reason}</Descriptions.Item>
                      </>
                    })
                  }
                </Descriptions>
              )
            },
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
              </Table.Summary.Row>
            </>
          )
        }}
      />
    </Modal>
  )
}

export default PomodoroModal

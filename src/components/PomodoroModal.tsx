import { IPomodoroInfo, updatePomodoroInfo } from '@/helper/pomodoro'
import { getInitialSettings } from '@/util/baseInfo'
import { IEvent } from '@/util/events'
import { Button, Descriptions, Modal, Table, Tag } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import ModifyPomodoro from './ModifyPomodoro'

const PomodoroModal: React.FC<{
  data: IEvent
  visible: boolean
  onOk: () => void
  onCancel: () => void
}> = ({ data, onCancel, onOk, visible }) => {
  const [pompdoroData, setPomodoroData] = useState<IPomodoroInfo[]>(data.addOns.pomodoros || [])
  const [modifyPomodoro, setModifyPomodoro] = useState<{ visible: boolean, data?: IPomodoroInfo }>({ visible: false })

  const addNewPomodoro = () => {
    const { pomodoro } = getInitialSettings()
    setPomodoroData([...pompdoroData, {
      start: dayjs().valueOf(),
      length: pomodoro.pomodoro * 60,
      isFull: true,
    }])
  }

  useEffect(() => {
    setPomodoroData(data.addOns.pomodoros || [])
  }, [data.uuid])

  return (
    <Modal
      title="Pomodoro"
      okText="Save"
      width="800px"
      visible={visible}
      onCancel={onCancel}
      onOk={async () => {
        const newContent = await updatePomodoroInfo(data.uuid, pompdoroData, 'update')
        if (newContent) logseq.Editor.updateBlock(data.uuid, newContent)
        onCancel()
      }}
    >
      <Button type="primary" onClick={addNewPomodoro} className="mb-4" icon={<PlusOutlined />}>Add New Pomodoro</Button>
      <Table
        pagination={false}
        dataSource={pompdoroData}
        id="start"
        columns={[
          { title: 'Full Tomato', dataIndex: 'isFull', render(value, record, index) {
            return value ? '✅' : '❌'
          }, },
          { title: 'Length', dataIndex: 'length', render: value => `${Math.ceil(value / 60)} min` },
          { title: 'Start', dataIndex: 'start', width: '200px', render: (value) => dayjs(value).format('YYYY-MM-DD HH:mm') },
          Table.EXPAND_COLUMN,
          {
            title: 'Interruption',
            dataIndex: 'interruptions',
            render: (value) => value?.length || 0,
          },
          {
            title: 'Action',
            dataIndex: 'operation',
            render: (value, record) => {
              return (
                <a onClick={() => setModifyPomodoro({ visible: true, data: record })}>Edit</a>
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
      <ModifyPomodoro
        visible={modifyPomodoro.visible}
        data={modifyPomodoro.data!}
        onCancel={() => setModifyPomodoro({ visible: false })}
        onOk={(data) => {
          if (modifyPomodoro?.data?.start) {
            setPomodoroData(pompdoroData.map((item) => {
              if (item.start === modifyPomodoro.data?.start) {
                return { ...item, ...data }
              }
              return item
            }))
            setModifyPomodoro({ visible: false })
          }
        }}
      />
    </Modal>
  )
}

export default PomodoroModal

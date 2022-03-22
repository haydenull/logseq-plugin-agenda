import { Form, Input, Modal, Radio } from 'antd'

const CreateCalendarModal: React.FC<{
  visible: boolean
  onSave: (params: { name: string; agenda?: boolean }) => void
  onCancel: () => void
}> = ({ visible, onCancel, onSave }) => {
  const [form] = Form.useForm()

  const createAgendaPage = async (name) => {
    const page = await logseq.Editor.getPage(name)
    console.log('[faiz:] === createAgendaPage getPage', page)
    if (page) {
      logseq.App.showMsg('The page with the same name already exists\nPlease add properties to the page manually\nagenda:: true', 'error')
      return { success: true }
    }


    const newPage = await logseq.Editor.createPage(name, { agenda: true })
    console.log('[faiz:] === createAgendaPage createPage', newPage)
    return { success: true }
  }

  return (
    <Modal
      title="Create Calendar"
      visible={visible}
      onOk={() => {
        form.validateFields().then(async values => {
          const name = values.calendarId.trim()
          if (values.agenda) {
            const { success } = await createAgendaPage(name)
            if (!success) return
          }
          onSave({
            name,
            agenda: Boolean(values.agenda),
          })
        })
      }}
      onCancel={onCancel}
    >
      <Form form={form}>
        <Form.Item name="calendarId" label="Calendar ID" rules={[{required: true}]}>
          <Input />
        </Form.Item>
        <Form.Item name="agenda" label="Control By Agenda" tooltip="Checking means that the plugin may modify this document">
          <Radio.Group>
            <Radio value={true}>Yes</Radio>
            <Radio value={false}>No</Radio>
          </Radio.Group>
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default CreateCalendarModal

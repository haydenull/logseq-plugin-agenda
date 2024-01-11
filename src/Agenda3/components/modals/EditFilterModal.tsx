import { Form, Input, Modal } from 'antd'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { Filter } from '@/Agenda3/models/settings'
import { BACKGROUND_COLOR, DEFAULT_BG_COLOR_NAME } from '@/constants/agenda'
import { genRandomString } from '@/util/util'

import ColorPickerCom from '../forms/ColorPickerCom'

const EditFilterModal = ({
  children,
  type,
  initialValues,
  onOk,
}: {
  children: React.ReactNode
  type: 'create' | 'edit'
  onOk: (param: Filter) => void
  initialValues?: Filter
}) => {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [formRef] = Form.useForm<Filter>()
  const handleClickOk = async () => {
    const values = await formRef.validateFields()
    onOk({
      ...values,
      id: type === 'create' ? genRandomString() : (initialValues?.id as string),
    })
    setOpen(false)
  }
  return (
    <>
      <span onClick={() => setOpen(true)}>{children}</span>
      <Modal
        destroyOnClose
        open={open}
        title={type === 'create' ? t('Create Filter') : t('Edit Filter')}
        onCancel={() => setOpen(false)}
        onOk={handleClickOk}
      >
        <Form<Filter>
          form={formRef}
          layout="vertical"
          initialValues={initialValues ?? { color: BACKGROUND_COLOR[DEFAULT_BG_COLOR_NAME] }}
          preserve={false}
          className="mt-8"
        >
          <Form.Item label={t('Filter Color')} name="color" rules={[{ required: true }]}>
            <ColorPickerCom />
          </Form.Item>
          <Form.Item label={t('Filter Name')} name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Query" name="query" rules={[{ required: true }]}>
            <Input.TextArea autoSize />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

export default EditFilterModal

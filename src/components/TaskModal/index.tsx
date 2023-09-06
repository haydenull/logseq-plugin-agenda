import { Button, Select as AntdSelect, message } from 'antd'
import { format } from 'date-fns'
import { type Dayjs } from 'dayjs'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import useProjects from '@/hooks/useProjects'
import { genTaskBlockContent, genTaskTimeInfoText } from '@/util/task'

import DateForm from './components/DateForm'
import DateRangeSelect from './components/DateRangeForm'
import PrioritySelect from './components/PrioritySelect'

const TaskModal: React.FC<{
  open: boolean
  onSave?: () => void
  onCancel?: () => void
}> = ({ open, onSave, onCancel }) => {
  const { t } = useTranslation()
  const [messageApi, contextHolder] = message.useMessage()

  // =========== task name =============
  const [taskName, setTaskName] = useState('')

  // =========== date info =============
  const [dateMode, setDateMode] = useState<'date' | 'dateRange'>('date')
  // date mode
  const [dateFormValue, setDateFormValue] = useState<DateFormValue>({ isAllDay: true })
  // date range mode
  const [dateRangeFormValue, setDateRangeFormValue] = useState<DateFormValue>({ isAllDay: true })
  const dateValue = dateMode === 'date' ? dateFormValue : dateRangeFormValue
  const showDateText = genShowDateText(dateValue)

  // ========== priority info =============
  const [priorityValue, setPriorityValue] = useState<PriorityValue>()

  // ========= project info =============
  const projects = useProjects()
  const [project, setProject] = useState<{ value: string }>({ value: 'journal' })

  const onClickCancel = () => onCancel?.()
  const onClickCreate = async () => {
    if (!taskName) return messageApi.error(t('Please enter a task name'))
    if (!dateValue || !dateValue.start || !dateValue.end) return messageApi.error(t('Please select a task date'))
    if (!project) return messageApi.error(t('Please select a project'))

    const blockContent = genTaskBlockContent(
      {
        taskName,
        timeInfo: {
          start: dateValue.start,
          end: dateValue.end,
          isAllDay: dateValue.isAllDay,
        },
        priority: priorityValue,
      },
      window.logseqAppUserConfigs?.preferredFormat,
    )

    const { preferredDateFormat } = await logseq.App.getUserConfigs()
    const todayJournalName = format(new Date(), preferredDateFormat)
    const todayJournalPage = await logseq.Editor.createPage(todayJournalName, {}, { journal: true })
    if (!todayJournalPage?.originalName) {
      return messageApi.error(t('Failed to create today journal page'))
    }
    const projectValue = project.value
    if (projectValue === 'journal') {
      // Journal task
      await logseq.Editor.insertBlock(todayJournalPage.originalName, blockContent, {
        isPageBlock: true,
        sibling: true,
      })
    } else {
      // Project task
      await logseq.Editor.insertBlock(todayJournalPage.originalName, blockContent, {
        isPageBlock: true,
        sibling: true,
        properties: {
          project: `[[${projectValue}]]`,
        },
      })
    }
    onSave?.()
  }

  return (
    <Dialog open={open}>
      <DialogContent showCloseButton={false} className="max-w-xl top-[30%] py-4 px-0">
        {contextHolder}
        <div className="px-1">
          <Input
            className="border-none focus-visible:ring-transparent text-xl"
            placeholder={t('Task Name')}
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
          />
        </div>

        <div className="flex px-5 gap-2">
          {/* ========= Task Date Start ========= */}
          <Popover>
            <PopoverTrigger>
              <div className="border px-2 py-0.5 rounded-md text-gray-500 text-sm">
                {showDateText || t('Task Date')}
              </div>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[286px]">
              <Tabs
                value={dateMode}
                onValueChange={(value) => setDateMode(value as 'date' | 'dateRange')}
                className="w-full"
              >
                <div className="flex justify-center">
                  <TabsList className="px-1 py-1 h-auto">
                    <TabsTrigger className="text-xs px-2 py-0.5" value="date">
                      {t('Date')}
                    </TabsTrigger>
                    <TabsTrigger className="text-xs px-2 py-0.5" value="dateRange">
                      {t('Date Range')}
                    </TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="date" className="w-full">
                  <DateForm value={dateFormValue} onChange={setDateFormValue} />
                </TabsContent>
                <TabsContent value="dateRange">
                  <DateRangeSelect value={dateRangeFormValue} onChange={setDateRangeFormValue} />
                </TabsContent>
              </Tabs>
            </PopoverContent>
          </Popover>
          {/* ========= Task Date End ========= */}

          {/* ========= Priority Start ========= */}
          <PrioritySelect value={priorityValue} onChange={setPriorityValue} />
          {/* ========= Priority End ========= */}
        </div>

        <Separator />
        <DialogFooter className="px-3">
          <div className="flex justify-between w-full">
            <AntdSelect
              labelInValue
              showSearch
              bordered={false}
              placeholder={t('Project')}
              popupMatchSelectWidth={300}
              popupClassName="pointer-events-auto min-w-[120px]"
              value={project}
              onChange={setProject}
              filterOption={(input, option) => (option?.value as string)?.toLowerCase()?.includes(input?.toLowerCase())}
            >
              {projects.map((project) => (
                <AntdSelect.Option key={project.value} value={project.value}>
                  <div className="flex flex-row items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-sm" style={{ backgroundColor: project.color }}></span>
                    {project.label}
                  </div>
                </AntdSelect.Option>
              ))}
            </AntdSelect>
            <div className="flex gap-2">
              <Button onClick={onClickCancel}>{t('Cancel')}</Button>
              <Button type="primary" onClick={onClickCreate}>
                {t('Create Task')}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export type DateFormValue = Partial<{
  isAllDay: boolean
  start: Dayjs
  end: Dayjs
}>
export type PriorityValue = 'A' | 'B' | 'C' | undefined

function genShowDateText(dateInfo: DateFormValue) {
  if (!dateInfo?.start || !dateInfo?.end) return null
  const { start, end, isAllDay = true } = dateInfo
  return genTaskTimeInfoText(start, end, isAllDay)
}

export default TaskModal

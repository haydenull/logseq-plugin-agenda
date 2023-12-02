import { useRequest } from 'ahooks'
import { message, notification } from 'antd'
import { createEvents, type EventAttributes } from 'ics'
import { useAtomValue } from 'jotai'
import { FiUploadCloud } from 'react-icons/fi'

import { track } from '@/Agenda3/helpers/umami'
import useSettings from '@/Agenda3/hooks/useSettings'
import { logseqAtom } from '@/Agenda3/models/logseq'
import { tasksWithStartAtom } from '@/Agenda3/models/tasks'
import { uploadIcsHttp } from '@/services/ics'
import { transformAgendaTaskToICSEvent } from '@/util/ics'
import { cn } from '@/util/util'

const UploadIcs = ({ className }: { className?: string }) => {
  const { currentGraph } = useAtomValue(logseqAtom)
  const tasks = useAtomValue(tasksWithStartAtom)
  const { settings } = useSettings()
  const { ics } = settings

  const { runAsync: doUpload, loading } = useRequest(uploadIcsHttp, { manual: true })

  const onClickUpload = async () => {
    track('Upload ICS Button')
    const { repo, token } = ics ?? {}
    if (!repo || !token) return message.error('Please set repo and token')
    if (!/^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/.test(repo)) return message.error('Invalid repo format. eg: username/repo')
    const events: EventAttributes[] = tasks.map((task) => transformAgendaTaskToICSEvent(task, currentGraph?.name ?? ''))
    if (events.length <= 0) return message.warning('There are no tasks to upload')
    createEvents(events, (error, value) => {
      if (error) return console.log('generate ics error', error)
      // console.log('ics text', value)
      doUpload({ file: value, repo, token })
        .then(() => message.success('🎉 Upload success'))
        .catch((err) => {
          notification.error({
            message: 'Upload failed',
            description: err.message,
            duration: 0,
          })
          console.error('update ics failed', err)
        })
    })
  }

  return (
    <div className="relative">
      <FiUploadCloud className={cn('text-lg', className)} onClick={onClickUpload} />
      {loading ? (
        <span className="animate-pulse absolute w-2 h-2 rounded-full bg-orange-500 top-0 right-0"></span>
      ) : null}
    </div>
  )
}

export default UploadIcs

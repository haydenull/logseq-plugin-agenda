import { useRequest } from 'ahooks'
import { message } from 'antd'
import { createEvents, type EventAttributes } from 'ics'
import { useAtomValue } from 'jotai'
import { FiUploadCloud } from 'react-icons/fi'

import useSettings from '@/hooks/useSettings'
import { track } from '@/newHelper/umami'
import { logseqAtom } from '@/newModel/logseq'
import { tasksWithStartAtom } from '@/newModel/tasks'
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
    const events: EventAttributes[] = tasks.map((task) => transformAgendaTaskToICSEvent(task, currentGraph?.name ?? ''))
    createEvents(events, (error, value) => {
      if (error) return console.log('generate ics error', error)
      // console.log('ics text', value)
      doUpload({ file: value, repo, token })
        .then(() => message.success('🎉 Upload success'))
        .catch((err) => {
          message.error(err.message || 'Upload failed')
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

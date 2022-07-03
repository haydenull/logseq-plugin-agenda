import React, { useEffect, useMemo, useRef, useState } from 'react'
import { PomodoroConfig, usePomodoro } from '@haydenull/use-pomodoro'
import { RiExternalLinkLine } from 'react-icons/ri'
import { FaPowerOff, FaHeartBroken } from 'react-icons/fa'
import { transformBlockToEvent } from './helper/transform'
import { getInitalSettings } from './util/baseInfo'
import { IEvent } from './util/events'
import { genToolbarPomodoro, secondsToTime, updatePomodoroInfo } from '@/helper/pomodoro'
import { getPageData } from './util/logseq'
import dayjs from 'dayjs'
import { notification } from './util/util'
import InerruptionModal from './components/InerruptionModal'

const OperationButton = ({ label, onClick, classNames = '' }: {label: string, onClick: () => void, classNames?: string}) => (
  <button
    onClick={onClick}
    className={`border-transparent font-medium shadow-sm px-3 py-2 text-sm leading-4 rounded-md bg-red-600 hover:bg-red-500 text-white uppercase cursor-pointer ${classNames}`}
  >
    {label}
  </button>
)
const SetTimeButton = ({ label, onClick, classNames = '' }: {label: string, onClick: () => void, classNames?: string}) => (
  <button
    onClick={onClick}
    className={`border-transparent bg-transparent font-medium shadow-sm w-12 h-5 text-xs leading-4 rounded-md border border-solid cursor-pointer description-text ${classNames}`}
  >
    {label}
  </button>
)

export type IPomodoroAppProps = {
  uuid: string
}
const PomodoroApp: React.FC<IPomodoroAppProps> = ({ uuid }) => {
  // const [time, setTime] = useState(duration)

  // const start = () => {
  //   logseq.Editor.updateBlock(uuid, `test {{renderer agenda, pomodoro-timer, 40, 'timing', 0}}`)
  // }
  const pomodoroConfig: PomodoroConfig = useMemo(() => {
    const { pomodoro: pomodoroConfig } = getInitalSettings()
    return {
      ...pomodoroConfig,
      pomodoro: pomodoroConfig.pomodoro * 60,
      shortBreak: pomodoroConfig.shortBreak * 60,
      longBreak: pomodoroConfig.longBreak * 60,
      notificationConfig: {
        type: 'every',
        time: 5,
      },
    }
  }, [uuid])
  const { state, start, stop, reset, goPomodoro, goShortBreak, goLongBreak, changeConfig } = usePomodoro(pomodoroConfig)
  const { pomodoro } = getInitalSettings()
  const [event, setEvent] = useState<IEvent>()
  const isWorking = state.type === 'pomodoro'
  const startTimeRef = useRef<number>()
  const [showInterruptionModal, setShowInterruptionModal] = useState(false)

  const changeTimeConfig = (time: number) => {
    changeConfig({
      ...state.config,
      pomodoro: time * 60,
    })
  }
  const navToBlock = async () => {
    if (!event) return
    const { id: pageId, originalName } = event?.page || {}
    let pageName = originalName
    if (!pageName) {
      const page = await getPageData({ id: pageId })
      pageName = page?.originalName
    }
    logseq.Editor.scrollToBlockInPage(pageName, event.uuid)
  }
  const startPomodoro = () => {
    start()
    const timestamp = dayjs().valueOf()
    startTimeRef.current = timestamp
    window.interruptionMap.set(timestamp, [])
  }
  const finishPomodoro = async () => {
    const pomodoroLength = state.config.pomodoro
    const timer = state.timer
    reset()
    const newContent = await updatePomodoroInfo(uuid, {
      isFull: false,
      start: startTimeRef.current!,
      length: pomodoroLength - timer,
      interruptions: window.interruptionMap.get(startTimeRef.current!) || [],
    })
    console.log('[faiz:] === newContent', newContent, uuid)
    if (newContent) logseq.Editor.updateBlock(uuid, newContent)
  }

  const renderButtons = () => {
    const { progress } = state

    if (isWorking) {
      return progress === 0
        ? <OperationButton label="start" onClick={startPomodoro} />
        : [
          <OperationButton key="stop" label="stop" onClick={reset} />,
          <OperationButton key="finish" label="finish" onClick={finishPomodoro} classNames="ml-2" />,
        ]
    } else {
      return progress === 0
        ? <OperationButton label="start" onClick={start} classNames="bg-green-600 hover:bg-green-500" />
        : <OperationButton label="skip" onClick={goPomodoro} classNames="bg-green-600 hover:bg-green-500" />
    }
  }

  useEffect(() => {
    console.log('[faiz:] === state', state)
    logseq.App.registerUIItem('toolbar', {
      key: 'logseq-plugin-agenda-pomodoro',
      template: genToolbarPomodoro(uuid, state.formattedTimer, state.progress, state.type !== 'pomodoro'),
    })
    window.currentPomodoro = {
      uuid,
      state: { paused: state.paused },
    }
  }, [state.formattedTimer, state.type, state.paused, uuid])
  useEffect(() => {
    if (!uuid) return
    if (!state.paused) return logseq.App.showMsg('Pomodoro is running, please stop it first.', 'error')
    logseq.Editor.getBlock(uuid).then(async block => {
      if (!block) return
      const event = await transformBlockToEvent(block!, getInitalSettings())
      setEvent(event)
    })
  }, [uuid])
  useEffect(() => {
    if (isWorking && state.progress === 1 && uuid) {
      updatePomodoroInfo(uuid, {
        isFull: true,
        start: startTimeRef.current!,
        length: state.config.pomodoro,
        interruptions: window.interruptionMap.get(startTimeRef.current!) || [],
      }).then(newContent => logseq.Editor.updateBlock(uuid, newContent!))
      notification('Pomodoro is finished!')
    }
  }, [isWorking, state.progress, uuid])

  return (
    <>
      <div className="fixed top-0 left-0 w-screen h-screen" onClick={() => logseq.hideMainUI()}></div>
      <div className="fixed right-10 shadow-md px-4 py-6 rounded-md bg-quaternary flex" style={{ top: '48px', minWidth: '300px' }}>
        <div className="flex-1">
          <div className="singlge-line-ellipsis cursor-pointer description-text flex items-center" style={{ maxWidth: '220px' }} onClick={navToBlock} title={event?.addOns.showTitle}>{event?.addOns.showTitle}<RiExternalLinkLine /></div>
          <div>
            <p className="text-center text-4xl mt-6 mb-6">{ state.formattedTimer }</p>
            <div className="flex flex-row justify-center">
              {renderButtons()}
            </div>
          </div>
        </div>
        <div className="flex flex-col w-12 justify-between pt-2">
          {
            pomodoro?.commonPomodoros?.map(time => (
              <SetTimeButton key={time} label={time + 'min'} onClick={() => changeTimeConfig(time)} />
            ))
          }
        </div>

        <div className="absolute right-5 top-1 opacity-60">
          <FaHeartBroken className="cursor-pointer" onClick={() => setShowInterruptionModal(true)} />
          <FaPowerOff
            className="ml-2 cursor-pointer"
            onClick={() => {
              logseq.hideMainUI()
              window?.unmountPomodoroApp()
              window.currentPomodoro = {}
              window.interruptionMap.delete(startTimeRef.current!)
              logseq.App.registerUIItem('toolbar', {
                key: 'logseq-plugin-agenda-pomodoro',
                template: `<div class="agenda-toolbar-pompdoro hide"></div>`,
              })
            }}
          />
        </div>

      </div>

      <InerruptionModal
        pomodoroId={startTimeRef.current!}
        visible={showInterruptionModal}
        onCancel={() => setShowInterruptionModal(false)}
      />
    </>
  )
}

export default PomodoroApp

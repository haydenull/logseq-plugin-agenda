import React, { useEffect, useMemo, useRef, useState } from 'react'
import { PomodoroConfig, usePomodoro } from '@haydenull/use-pomodoro'
import { RiExternalLinkLine } from 'react-icons/ri'
import { MdOutlineRunningWithErrors } from 'react-icons/md'
import { AiOutlinePoweroff, AiOutlineQuestionCircle } from 'react-icons/ai'
import { transformBlockToEvent } from './helper/transform'
import { getInitialSettings } from './util/baseInfo'
import { IEvent } from './util/events'
import { genToolbarPomodoro, secondsToTime, updatePomodoroInfo } from '@/helper/pomodoro'
import { getPageData, navToBlock } from './util/logseq'
import dayjs from 'dayjs'
import { notification } from './util/util'
import InerruptionModal from './components/InerruptionModal'
import useTheme from './hooks/useTheme'
import { ConfigProvider, Tooltip } from 'antd'
import { ANTD_THEME_CONFIG } from './util/constants'

const OperationButton = ({ label, onClick, classNames = '', tooltip }: {label: string; onClick: () => void; classNames?: string; tooltip?: string}) => (
  <button
    onClick={onClick}
    className={`border-transparent font-medium shadow-sm px-3 py-2 text-sm leading-4 rounded-md bg-red-600 hover:bg-red-500 text-white uppercase cursor-pointer ${classNames}`}
  >
    <Tooltip title={tooltip}>
      <div className="flex items-center">{label}{tooltip ? <AiOutlineQuestionCircle className="ml-1" /> : ''}</div>
    </Tooltip>
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
  const theme = useTheme() || 'green'

  const pomodoroConfig: PomodoroConfig = useMemo(() => {
    const { pomodoro: pomodoroConfig } = getInitialSettings()
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
  const { pomodoro } = getInitialSettings()
  const [event, setEvent] = useState<IEvent>()
  const [position, setPosition] = useState({ right: '40px', top: '48px' })
  const isWorking = state.type === 'pomodoro'
  const startTimeRef = useRef<number>()
  const [showInterruptionModal, setShowInterruptionModal] = useState(false)

  const changeTimeConfig = (time: number) => {
    changeConfig({
      ...state.config,
      pomodoro: time * 60,
    })
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
    if (newContent) logseq.Editor.updateBlock(uuid, newContent)
  }

  const renderButtons = () => {
    const { progress } = state

    if (isWorking) {
      return progress === 0
        ? <OperationButton label="start" onClick={startPomodoro} />
        : [
          <OperationButton key="stop" label="stop" onClick={reset} tooltip="Give up this pomodoro and do not record the time" />,
          <OperationButton key="finish" label="finish" onClick={finishPomodoro} classNames="ml-2" tooltip="Complete this pomodoro and record the time" />,
        ]
    } else {
      return progress === 0
        ? <OperationButton label="start" onClick={start} classNames="bg-green-600 hover:bg-green-500" />
        : <OperationButton label="skip" onClick={goPomodoro} classNames="bg-green-600 hover:bg-green-500" />
    }
  }

  useEffect(() => {
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
    if (!state.paused) return logseq.UI.showMsg('Pomodoro is running, please stop it first.', 'error') as unknown as undefined
    logseq.Editor.getBlock(uuid).then(async block => {
      if (!block) return
      const event = await transformBlockToEvent(block!, getInitialSettings())
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

  useEffect(() => {
    if (logseq.isMainUIVisible) {
      const rightSidebarElement = parent.document.getElementById('right-sidebar')
      const width = rightSidebarElement?.getBoundingClientRect()?.width || 0
      setPosition(_position => ({ ..._position, right: width + 40 + 'px' }))
    }
  }, [logseq.isMainUIVisible])

  return (
    <ConfigProvider
      theme={ANTD_THEME_CONFIG[theme]}
    >
      <div className="fixed top-0 left-0 w-screen h-screen" onClick={() => logseq.hideMainUI()}></div>
      <div className="fixed right-10 shadow-xl px-4 py-6 rounded-md bg-quaternary flex transition-all" style={{ top: '48px', right: position.right, minWidth: '300px' }}>
        <div className="flex-1">
          <div className="singlge-line-ellipsis cursor-pointer description-text flex items-center" style={{ maxWidth: '220px' }} onClick={() => event && navToBlock(event)} title={event?.addOns.showTitle}>{event?.addOns.showTitle}<RiExternalLinkLine /></div>
          <div>
            <p className="text-center text-4xl mt-6 mb-6 title-text">{ state.formattedTimer }</p>
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

        <div className="absolute right-5 top-1 opacity-60 text">
          <Tooltip title="Record interruption">
            <MdOutlineRunningWithErrors className="cursor-pointer" onClick={() => setShowInterruptionModal(true)} />
          </Tooltip>
          <Tooltip title="Exit pomodoro">
            <AiOutlinePoweroff
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
          </Tooltip>
        </div>

      </div>

      <InerruptionModal
        pomodoroId={startTimeRef.current!}
        visible={showInterruptionModal}
        onCancel={() => setShowInterruptionModal(false)}
      />
    </ConfigProvider>
  )
}

export default PomodoroApp

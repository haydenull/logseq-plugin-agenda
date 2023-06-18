import { MARKDOWN_POMODORO_REG, ORG_POMODORO_REG, POMODORO_INTERRUPTION_SEPARATOR } from '@/util/constants'
import { parseUrlParams } from '@/util/util'
import { BlockEntity } from '@logseq/libs/dist/LSPlugin'
export const secondsToTime = (seconds: number) => {
  const minute = Math.floor((seconds % 3600) / 60)
  const second = Math.floor(seconds % 60)
  return `${minute < 10 ? '0' + minute : minute}:${second < 10 ? '0' + second : second}`
}

export const genToolbarPomodoro = (uuid: string, time: string, progress: number, isBreak: boolean = false) => {
  return `<a data-on-click="showPomodoro" class="agenda-toolbar-pompdoro ${isBreak ? 'break' : ''}" data-uuid="${uuid}">
    ${time}
    <div class="timer-progress-back" style="width: ${progress * 100}%;"></div>
  </a>`
}

export const togglePomodoro = (show: boolean = true) => {
  const pomodoro = document.querySelector('#pomodoro-root')
  if (pomodoro && show) pomodoro.classList.remove('hide')
  if (pomodoro && !show) pomodoro.classList.add('hide')
}

export type IInterruption = {
  type: number // 1: internal interruption  2: external interruption
  time: number
  remark: string
}
export type IPomodoroInfo = {
  isFull: boolean
  start: number
  length: number
  interruptions?: IInterruption[]
}
export const getPomodoroInfo = (blockContent: string, format: BlockEntity['format']): IPomodoroInfo[] | null => {
  const reg = format === 'markdown' ? MARKDOWN_POMODORO_REG : ORG_POMODORO_REG
  const res = blockContent.match(reg)
  if (!res || !res?.[1]) return null
  // >[🍅 50min](#agenda-pomo://?t=f-20220614123213-10,p-2023829809-4,p-2023829809-3-113040990remarkkkk|`~|213040990remarkkkk)
  const params = parseUrlParams(res[1])
  const pomodoroInfo = params.t
  if (!pomodoroInfo) return null
  const pomodoros = pomodoroInfo.split(',')
  return pomodoros.map((pomodoro) => {
    const info = pomodoro.split('-')
    const [type, start, length, ...interruption] = info
    const interruptionStr = interruption.join('-')

    const interruptions = interruption?.length > 0 ? interruptionStr.split(POMODORO_INTERRUPTION_SEPARATOR) : []

    return {
      isFull: type === 'f',
      start: parseInt(start),
      length: parseInt(length),
      interruptions: interruptions.map((str) => {
        return {
          type: Number(str?.[0]),
          time: Number(str.substring(1, 14)),
          remark: str.substring(14),
        }
      }),
    }
  })
}

export const updatePomodoroInfo = async (
  uuid: string,
  newPomodoro: IPomodoroInfo | IPomodoroInfo[],
  type: 'addon' | 'update' = 'addon'
) => {
  const block = await logseq.Editor.getBlock(uuid)
  if (!block) return
  let newPomodoros = ([] as IPomodoroInfo[]).concat(newPomodoro)
  if (type === 'addon') {
    const pomodoros = getPomodoroInfo(block.content, block.format) || []
    newPomodoros = pomodoros.concat(newPomodoro)
  }
  // gen new pomodoro info text
  const newInfoText = newPomodoros
    .map((pomodoro) => {
      const { isFull, start, length, interruptions } = pomodoro
      const type = isFull ? 'f' : 'p'

      const interruptionStr = interruptions
        ?.map((interruption) => {
          const { type, time, remark } = interruption
          return `${type}${time}${remark}`
        })
        .join(POMODORO_INTERRUPTION_SEPARATOR)

      return `${type}-${start}-${length}${interruptionStr ? `-${interruptionStr}` : ''}`
    })
    .join(',')

  const url = new URL('agenda-pomo://')
  url.searchParams.append('t', newInfoText)

  const countTime = newPomodoros.reduce((acc, pomodoro) => {
    return acc + pomodoro.length
  }, 0)
  const tomato =
    newPomodoros
      .filter((pomodoro) => pomodoro.isFull)
      ?.map(() => '🍅')
      ?.join('') || '🍅'
  const showText = `${tomato} ${Math.ceil(countTime / 60)}min`

  const newInfo =
    block?.format === 'org' ? `>[[#${url.toString()}][${showText}]]` : `>[${showText}](#${url.toString()})`

  // replace
  const [firstLine, ...otherLines] = block.content?.split('\n') || []
  let newFirstLine = firstLine
  const reg = block.format === 'markdown' ? MARKDOWN_POMODORO_REG : ORG_POMODORO_REG
  if (reg.test(block.content)) {
    newFirstLine = firstLine.replace(reg, newInfo)
  } else {
    newFirstLine = `${firstLine} ${newInfo}`
  }
  return `${newFirstLine}\n${otherLines.join('\n')}`
}

export const removePomodoroInfo = (blockContent: string, format: BlockEntity['format']) => {
  const reg = format === 'markdown' ? MARKDOWN_POMODORO_REG : ORG_POMODORO_REG
  return blockContent.replace(reg, '')?.trim()
}

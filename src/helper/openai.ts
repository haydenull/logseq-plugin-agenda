import { Language } from '@/constants/language'
import { getInitialSettings } from '@/util/baseInfo'
import { message } from 'antd'
import { ValuesType } from 'utility-types'

const genSystemPrompt = (language: ValuesType<typeof Language>, projectList: string[]) => {
  switch (language) {
    case Language.English:
      return `You are a schedule assistant.
      The current time is ${new Date().toString()}, and I have the following project to handle: ${JSON.stringify(
        projectList
      )}.
      You need to extract the task information from my message and return it in JSON format with the following keys: title, start, end, isAllDay, project. Please do not provide any additional information, and return only one task at a time. The time zone for all times should be the same as mine.`
    case Language['Simplified Chinese']:
      return `你是一名日程助理。
      现在的时间是${new Date().toString()}, 我目前有这些需要处理的项目 ${JSON.stringify(projectList)}。
      你需要从我的话中提取任务信息并以 json 格式返回，不要有任何其余的解释, 每次只返回一个任务, 所有时间的时区与我的时区一致, json 具有以下的 key: title, start, end, isAllDay, project`

    default:
      break
  }
}
async function readStream(stream: ReadableStream<Uint8Array> | null): Promise<string> {
  if (!stream) {
    throw new Error('Stream is null or undefined.')
  }

  const chunks: Uint8Array[] = []
  const reader = stream.getReader()
  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      break
    }
    chunks.push(value)
  }

  const merged = chunks.reduce((prev, curr) => prev.concat(Array.from(curr)), [] as number[])
  const decoded = new TextDecoder().decode(new Uint8Array(merged))
  return decoded
}

export type OpenAIResponse = {
  choices: {
    index: number
    message: {
      role: 'assistant'
      content: string
    }
  }[]
}
// title, start, end, isAllDay, project
export type OpenAIMessageContent = {
  title: string
  start: string
  end: string
  isAllDay: boolean
  project: string
}

const DEFAULT_API_BASE_URL = 'https://api.openai.com'
const COMMON_PAYLOAD = {
  model: 'gpt-3.5-turbo',
  temperature: 0,
  max_tokens: 256,
  top_p: 1,
  frequency_penalty: 0,
  presence_penalty: 0,
  stream: false,
}

export const getScheduleInfoFromAI = async (scheduleMessage: string) => {
  const { openai, projectList, language } = getInitialSettings()
  if (!openai?.apiKey) {
    message.error('Please check your openai configuration')
    return Promise.reject(new Error('openai api key not found'))
  }
  const { apiKey, apiBaseUrl = DEFAULT_API_BASE_URL } = openai

  const PROJECT_LIST = projectList?.filter((project) => project.enabled)?.map((project) => project.id) || []

  const response = await fetch(`${apiBaseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      ...COMMON_PAYLOAD,
      messages: [
        {
          role: 'system',
          content: genSystemPrompt(language, PROJECT_LIST),
        },
        {
          role: 'user',
          content: scheduleMessage,
        },
      ],
    }),
  })
  const data = await readStream(response.body)
  return JSON.parse(data) as OpenAIResponse
}

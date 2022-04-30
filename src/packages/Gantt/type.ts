export type IEvent = {
  id: string
  title: string
  start: string
  end: string
  raw?: any
  level?: number
  detailPopup?: JSX.Element
}

export type IGroup = {
  id: string
  title: string
  raw?: any
  events: IEvent[]
  milestones?: IEvent[]
  levelCount?: number
  style: {
    color: string
    bgColor: string
    borderColor: string
  }
}

export type ICooradinate = {
  x: number
  y: number
}

export type IMode = 'simple' | 'advanced'

export type IView = 'day' | 'week' | 'month'
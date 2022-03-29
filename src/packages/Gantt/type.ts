export type IEvent = {
  id: string
  title: string
  start: string
  end: string
  raw?: any
}

export type IGroup = {
  id: string
  title: string
  raw?: any
  events: IEvent[]
  milestones?: IEvent[]
}
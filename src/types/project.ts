export type AgendaProject = {
  id: string // uuid
  originalName: string
  isJournal: boolean
  journalDay?: number
  isFavorite?: boolean
  bgColor?: string
  textColor?: string
  updatedAt?: number
  createdAt?: number
  properties?: {
    'agenda-color'?: string
    [key: string]: string | boolean | undefined
  }
  propertiesOrder?: string[]
  propertiesTextValues?: {
    'agenda-color'?: string
    [key: string]: string | undefined
  }
}

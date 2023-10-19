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
    'agenda-favorite'?: 'yes' | 'no'
    'agenda-color'?: string
    [key: string]: string | boolean | undefined
  }
  propertiesOrder?: string[]
  propertiesTextValues?: {
    'agenda-favorite'?: string
    'agenda-color'?: string
    [key: string]: string | undefined
  }
}

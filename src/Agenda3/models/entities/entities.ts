import { atom } from 'jotai'

import type { AgendaEntity } from '@/types/entity'

export const agendaEntitiesAtom = atom<AgendaEntity[]>([])

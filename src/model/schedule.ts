import { atom } from 'jotai'
import { ISchedule } from 'tui-calendar'

export const projectSchedulesAtom = atom<ISchedule[]>([])
export const subscriptionSchedulesAtom = atom<ISchedule[]>([])

export const schedulesAtom = atom((get) => get(projectSchedulesAtom).concat(get(subscriptionSchedulesAtom)))
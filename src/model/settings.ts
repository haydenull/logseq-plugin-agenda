import { atom } from 'jotai'
import { getInitalSettings } from '@/util/baseInfo'
import type { ISettingsForm } from '@/util/type'

export const settingsAtom = atom<ISettingsForm>(getInitalSettings())
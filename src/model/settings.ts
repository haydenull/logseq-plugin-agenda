import { atom } from 'jotai'
import { getInitialSettings } from '@/util/baseInfo'
import type { ISettingsForm } from '@/util/type'

export const settingsAtom = atom<ISettingsForm>(getInitialSettings())
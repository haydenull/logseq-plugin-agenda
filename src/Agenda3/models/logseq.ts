import type { AppGraphInfo } from '@logseq/libs/dist/LSPlugin'
import { atom } from 'jotai'

export type LogseqApp = {
  currentGraph?: AppGraphInfo
}
export const logseqAtom = atom<LogseqApp>({})

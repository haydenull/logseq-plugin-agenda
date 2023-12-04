import dayjs from 'dayjs'
import { describe, expect, test } from 'vitest'

import {
  genDurationString,
  generateTimeLogText,
  parseAgendaDrawer,
  parseDurationString,
  updateBlockAgendaDrawer,
  updateBlockScheduled,
  updateBlockTimeLogText,
  updateBlockTaskTitle,
} from '../block'

const DEMO_AGENDA_DRAWER = `:AGENDA:
estimated: 1h30m
:END:`
const DEMO_AGENDA_DRAWER_NULL = `:AGENDA:
:END:`

describe('helper: block', () => {
  test('generateTimeLogText', () => {
    const data = {
      start: dayjs('2023-09-24 19:30', 'YYYYMMDD HH:mm'),
      end: dayjs('2023-09-24 20:00', 'YYYYMMDD HH:mm'),
    }
    expect(generateTimeLogText(data)).toEqual(
      `CLOCK: [2023-09-24 Sun 19:30:00]--[2023-09-24 Sun 20:00:00] =>  00:30:00`,
    )
  })
  test('parseDurationString', () => {
    expect(parseDurationString('1h30m')).toEqual(90)
    expect(parseDurationString('1h')).toEqual(60)
    expect(parseDurationString('30m')).toEqual(30)
    expect(parseDurationString(undefined)).toEqual(undefined)
  })
  test('genDurationString', () => {
    expect(genDurationString(90)).toEqual('1h30m')
    expect(genDurationString(60)).toEqual('1h')
    expect(genDurationString(30)).toEqual('30m')
  })
  test('parseAgendaDrawer', () => {
    expect(parseAgendaDrawer('\n' + DEMO_AGENDA_DRAWER)).toEqual({
      estimated: 90,
    })
    expect(parseAgendaDrawer(DEMO_AGENDA_DRAWER_NULL)).toEqual(null)
  })
  test('updateAgendaDrawer', () => {
    expect(updateBlockAgendaDrawer(`TODO test\n${DEMO_AGENDA_DRAWER}`, { estimated: 80 })).toEqual(
      `TODO test\n:AGENDA:\nestimated: 1h20m\n:END:`,
    )
    // expect(updateAgendaDrawer(`TODO test\n${DEMO_AGENDA_DRAWER}`, { estimated: 30 })).toEqual(`TODO test\n`)
  })
  test('updateScheduled', () => {
    const start = dayjs('2023-09-24 19:00', 'YYYYMMDD HH:mm')
    expect(
      updateBlockScheduled(
        `TODO test\nSCHEDULED: <2023-09-24 Sun 19:00>\n:LOGBOOK:\nCLOCK: [2023-09-24 Sun 19:30:00]--[2023-09-24 Sun 20:00:00] =>  00:30:00\n:END:`,
        {
          start,
          allDay: true,
        },
      ),
    ).toEqual(
      `TODO test\nSCHEDULED: <2023-09-24 Sun>\n:LOGBOOK:\nCLOCK: [2023-09-24 Sun 19:30:00]--[2023-09-24 Sun 20:00:00] =>  00:30:00\n:END:`,
    )
    expect(
      updateBlockScheduled(
        `TODO test\n:LOGBOOK:\nCLOCK: [2023-09-24 Sun 19:30:00]--[2023-09-24 Sun 20:00:00] =>  00:30:00\n:END:`,
        {
          start,
          allDay: true,
        },
      ),
    ).toEqual(
      `TODO test\n:LOGBOOK:\nCLOCK: [2023-09-24 Sun 19:30:00]--[2023-09-24 Sun 20:00:00] =>  00:30:00\n:END:\nSCHEDULED: <2023-09-24 Sun>`,
    )
    expect(
      updateBlockScheduled(
        `TODO test\nSCHEDULED: <2023-09-24 Sun 19:00>\n:LOGBOOK:\nCLOCK: [2023-09-24 Sun 19:30:00]--[2023-09-24 Sun 20:00:00] =>  00:30:00\n:END:`,
        {
          start,
          allDay: false,
        },
      ),
    ).toEqual(
      `TODO test\nSCHEDULED: <2023-09-24 Sun 19:00>\n:LOGBOOK:\nCLOCK: [2023-09-24 Sun 19:30:00]--[2023-09-24 Sun 20:00:00] =>  00:30:00\n:END:`,
    )
    expect(
      updateBlockScheduled(
        `TODO test\nSCHEDULED: <2023-09-24 Sun 19:00>\n:LOGBOOK:\nCLOCK: [2023-09-24 Sun 19:30:00]--[2023-09-24 Sun 20:00:00] =>  00:30:00\n:END:`,
        {},
      ),
    ).toEqual(`TODO test\n:LOGBOOK:\nCLOCK: [2023-09-24 Sun 19:30:00]--[2023-09-24 Sun 20:00:00] =>  00:30:00\n:END:`)
  })
  test('updateTitle', () => {
    expect(updateBlockTaskTitle(`TODO test\nSCHEDULED: <2023-09-24 Sun 19:00>`, 'new title', 'todo')).toEqual(
      `TODO new title\nSCHEDULED: <2023-09-24 Sun 19:00>`,
    )
  })
  test('updateTimeLogText', () => {
    expect(
      updateBlockTimeLogText(
        `TODO test\nSCHEDULED: <2023-09-24 Sun 19:00>\n:LOGBOOK:\nCLOCK: [2023-09-24 Sun 19:30:00]--[2023-09-24 Sun 20:00:00] =>  00:30:00\n:END:`,
        [
          {
            start: dayjs('2023-09-25 09:00'),
            end: dayjs('2023-09-25 09:45'),
          },
          {
            start: dayjs('2023-09-25 14:00'),
            end: dayjs('2023-09-25 15:00'),
          },
        ],
      ),
    ).toEqual(
      `TODO test\nSCHEDULED: <2023-09-24 Sun 19:00>\n:LOGBOOK:\nCLOCK: [2023-09-25 Mon 09:00:00]--[2023-09-25 Mon 09:45:00] =>  00:45:00\nCLOCK: [2023-09-25 Mon 14:00:00]--[2023-09-25 Mon 15:00:00] =>  01:00:00\n:END:`,
    )
  })
})

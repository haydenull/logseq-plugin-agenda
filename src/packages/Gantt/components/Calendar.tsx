import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import dayjs from 'dayjs'
import { extractDays, getXCoordinate, isWeekend, getDataWithGroupCoordinates, transformDataToSimpleMode, getDateRange, scrollToDate } from '../util'
import { IGroup, IMode, IView } from '../type'
import { CALENDAR_EVENT_HEIGHT, CALENDAR_EVENT_WIDTH, CALENDAR_GROUP_GAP, SIDEBAR_GROUP_TITLE_HEIGHT } from '../constants'
import { Popover } from 'antd'

const Calendar: React.FC<{
  data: IGroup[]
  mode: IMode
  view?: IView
  weekStartDay?: number
  uniqueId?: string
  foldedGroups?: string[]
}> = ({ data, mode = 'simple', view = 'day', weekStartDay = 0, uniqueId = '', foldedGroups }, ref) => {
  const current = dayjs()
  const expandGroupData = Array.isArray(foldedGroups) ? data.filter(group => !foldedGroups?.includes(group.id)) : data
  const { start: rangeStart, end: rangeEnd } = getDateRange(expandGroupData)
  const start = rangeStart.subtract(1, 'day')
  const end = rangeEnd.add(9, 'day')
  const calendarEventWidth = CALENDAR_EVENT_WIDTH[view]

  const dateMarks = extractDays(start, end)

  const dataWithGroupCoordinate = getDataWithGroupCoordinates(expandGroupData, mode)

  const dataWithCoordinates = dataWithGroupCoordinate.map((group, groupIndex) => {
    const { events, milestones = [] } = group
    const eventHeightCount = mode === 'simple' ? (group.levelCount || 0) * CALENDAR_EVENT_HEIGHT : events.length * CALENDAR_EVENT_HEIGHT
    const milestoneHeightCount = mode === 'simple' ? (milestones.length > 0 ? 1 : 0) * CALENDAR_EVENT_HEIGHT : milestones.length * CALENDAR_EVENT_HEIGHT
    const groupHeight = eventHeightCount + milestoneHeightCount + SIDEBAR_GROUP_TITLE_HEIGHT
    return {
      ...group,
      height: groupHeight,
      // eventCount: group.events.concat(group.milestones || []).length,
      events: group.events.map((event, eventIndex) => {
        const yIndex = mode === 'simple' ? (event?.level || 0) : eventIndex
        return {
          ...event,
          coordinates: {
            x: getXCoordinate(start, dayjs(event.start), calendarEventWidth),
            y: group.coordinate.y + yIndex * CALENDAR_EVENT_HEIGHT,
          },
          size: {
            width: calendarEventWidth * (dayjs(event.end).diff(dayjs(event.start), 'day') + 1) - 8,
            height: CALENDAR_EVENT_HEIGHT - 4,
          },
        }
      }),
      milestones: group.milestones?.map((milestone, milestoneIndex) => {
        const yIndex = mode === 'simple' ? 0 : milestoneIndex
        return {
          ...milestone,
          coordinates: {
            x: getXCoordinate(start, dayjs(milestone.start), calendarEventWidth),
            y: group.coordinate.y + eventHeightCount + yIndex * CALENDAR_EVENT_HEIGHT,
          },
        }
      }),
    }
  })
  const groupHeightCount = dataWithCoordinates.reduce((acc, cur) => acc + cur.height + CALENDAR_GROUP_GAP, 0)

  useEffect(() => {
    document.getElementById(`date${uniqueId}${dayjs().format('YYYYMMDD')}`)?.scrollIntoView({ block: 'nearest', inline: 'center' })
  }, [])

  useImperativeHandle(ref, () => ({
    scrollToToday() {
      scrollToDate(dayjs(), uniqueId)
    },
  })), []

  return (
    <div className="calendar h-fit w-fit">
      {/* ========= calendar header start ========= */}
      <div className="w-fit whitespace-nowrap bg-quaternary sticky top-0 z-20 text">
        {
          dateMarks.map((mark) => {
            const date = mark.format('DD')
            const isShowMonth = date === '01' || mark.isSame(start, 'day') || mark.isSame(end, 'day')
            return (<div className="inline" key={'month' + mark.valueOf()}>
              <span className="inline-block text-center sticky bg-quaternary overflow-visible box-content" style={{ width: `${calendarEventWidth}px`, left: 0, lineHeight: '25px', paddingRight: '100px', marginRight: '-100px' }}>
                {isShowMonth ? mark.format('MMMM YYYY') : ''}
              </span>
            </div>)
          })
        }
      </div>
      <div className="calendar__header w-fit whitespace-nowrap bg-quaternary sticky z-20" style={{ top: '25px' }}>
        {
          dateMarks.map((mark) => {
            const date = mark.format('DD')
            const _isWeekend = isWeekend(mark)
            const isToday = mark.isSame(current, 'day')
            let isShowDate = true
            if (view === 'month') {
              isShowDate = mark.day() === weekStartDay || isToday
            }
            return (<div className={`calendar__date inline-flex ${_isWeekend ? 'weekend' : ''} ${isToday ? 'today' : ''}`} id={'date' + uniqueId + mark.format('YYYYMMDD')} key={'date' + mark.valueOf()}>
              <span className={`inline-block text-center ${!isShowDate ? 'opacity-0' : ''}`} style={{ width: '108px' }}>{date}</span>
            </div>)
          })
        }
      </div>
      {/* ========= calendar header end ========= */}

      {/* ========== calendar content start ========= */}
      <div className="calendar__content relative" style={{ height: groupHeightCount + 'px' }}>
        {/* <div className="h-full absolute flex">
          {
            dateMarks.map((mark, index) => {
              const _isWeekend = isWeekend(mark)
              const isToday = mark.isSame(current, 'day')
              return (<div className={`calendar__content__back ${_isWeekend ? 'weekend' : ''} ${isToday ? 'today' : ''}`}></div>)
            })
          }
        </div> */}
        {
          dataWithCoordinates.map(group => {
            return (
              // 每个 group 都生成自己的back有点浪费，其实是可以合并成一个的
              <div className="calendar__group w-fit" key={group.id}>
                <div className="flex">
                  {
                    dateMarks.map((mark, index) => {
                      const _isWeekend = isWeekend(mark)
                      const isToday = mark.isSame(current, 'day')
                      return (<div className={`calendar__content__back ${_isWeekend ? 'weekend' : ''} ${isToday ? 'today' : ''}`} style={{ height: group.height + 'px' }}></div>)
                    })
                  }
                </div>
                {/* ===== calendar event start ==== */}
                {
                  group.events.map(event => {
                    const { coordinates, size, detailPopup, completed } = event
                    return (
                      <Popover
                        content={detailPopup}
                        trigger="click"
                      >
                        <div
                          key={event.id}
                          className={`calendar__event absolute bg-quaternary rounded cursor-pointer single_ellipsis shadow ${completed ? 'completed' : ''}`}
                          style={{
                            left: coordinates.x,
                            top: coordinates.y + SIDEBAR_GROUP_TITLE_HEIGHT,
                            width: size.width + 'px',
                            height: size.height + 'px',
                            zIndex: 1,
                          }}
                          title={event.title}
                        >
                          {event.title}
                        </div>
                      </Popover>
                    )
                  })
                }
                {/* ===== calendar event end ==== */}
                {/* ===== calendar milestone start ==== */}
                {
                  group.milestones?.map(milestone => {
                    const { coordinates, detailPopup, completed } = milestone
                    return (
                      <>
                        <div key={'milestone-line' + milestone.id} className="calendar__milestone__line absolute" style={{ left: coordinates.x + calendarEventWidth / 2, top: group.coordinate.y, height: group.height + 16 }}>
                          {/* <span className="absolute ml-3">{milestone.title}</span> */}
                        </div>
                        <Popover
                          content={detailPopup}
                          trigger="click"
                        >
                          <div
                            key={'milestone-text' + milestone.id}
                            className="calendar__milestone__text absolute flex items-center cursor-pointer"
                            style={{ left: coordinates.x + 2 + calendarEventWidth / 2, top: coordinates.y + SIDEBAR_GROUP_TITLE_HEIGHT }}
                            title={milestone.title}
                          >
                            { completed && <svg data-v-651e2bfe="" viewBox="0 0 16 16" fill="white" className="milestone__mark"><path data-v-651e2bfe="" d="M5.536 11.175L2 7.639l1.497-1.497L7 9.642l6-6.28 1.497 1.497-7.464 7.814-1.497-1.497z"></path></svg> }
                            <span className="single_ellipsis" style={{ maxWidth: calendarEventWidth - 20 }}>
                              {milestone.title}
                            </span>
                          </div>
                        </Popover>
                      </>
                    )
                  })
                }
                {/* ===== calendar milestone end ==== */}
              </div>
            )
          })
        }
      </div>
      {/* ========== calendar content end ========= */}
    </div>
  )
}

// @ts-ignore
export default forwardRef(Calendar)

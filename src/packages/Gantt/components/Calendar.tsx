import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import dayjs from 'dayjs'
import { extractDays, getXCoordinate, isWeekend, getDataWithGroupCoordinates, transformDataToSimpleMode } from '../util'
import { IGroup, IMode } from '../type'
import { CALENDAR_EVENT_HEIGHT, CALENDAR_EVENT_WIDTH, SIDEBAR_GROUP_TITLE_HEIGHT } from '../constants'

const Calendar: React.FC<{
  data: IGroup[]
  mode: IMode
}> = ({ data, mode }, ref) => {
  const current = dayjs()
  // TODO: 开始日期设置为2个月前, 结束日期设置为4个月后
  const start = current.startOf('month').subtract(1, 'month')
  const end = current.endOf('month').add(1, 'month')

  const [scale, setScale] = useState('day')
  const [dateMarks, setDateMarks] = useState(extractDays(start, end))

  const dataWithGroupCoordinate = getDataWithGroupCoordinates(data, mode)

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
            x: getXCoordinate(start, dayjs(event.start)),
            y: group.coordinate.y + yIndex * CALENDAR_EVENT_HEIGHT,
          },
          size: {
            width: CALENDAR_EVENT_WIDTH * (dayjs(event.end).diff(dayjs(event.start), 'day') + 1) - 8,
            height: CALENDAR_EVENT_HEIGHT - 4,
          },
        }
      }),
      milestones: group.milestones?.map((milestone, milestoneIndex) => {
        const yIndex = mode === 'simple' ? 0 : milestoneIndex
        return {
          ...milestone,
          coordinates: {
            x: getXCoordinate(start, dayjs(milestone.start)),
            y: group.coordinate.y + eventHeightCount + yIndex * CALENDAR_EVENT_HEIGHT,
          },
        }
      }),
    }
  })
  const groupHeightCount = dataWithCoordinates.reduce((acc, cur) => acc + cur.height, 0)
  console.log('[faiz:] === dataWithCoordinates', dataWithCoordinates)

  useEffect(() => {
    document.querySelector(`#date${dayjs().format('YYYYMMDD')}`)?.scrollIntoView({ block: 'nearest', inline: 'center' })
  }, [])

  useImperativeHandle(ref, () => ({
    scrollToToday() {
      document.querySelector(`#date${dayjs().format('YYYYMMDD')}`)?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
    },
  })), []

  return (
    <div className="calendar flex-1 h-fit w-fit">
      {/* ========= calendar header start ========= */}
      <div className="calendar__header w-fit whitespace-nowrap bg-white sticky top-0 z-20">
        {
          dateMarks.map((mark, index) => {
            const date = mark.format('DD')
            const month = mark.format('MM')
            const _isWeekend = isWeekend(mark)
            const isToday = mark.isSame(current, 'day')
            return (<div className={`date relative inline-flex justify-center ${_isWeekend ? 'weekend' : ''} ${isToday ? 'today' : ''}`} id={'date' + mark.format('YYYYMMDD')}>
              { date === '01' && <span className="date__month opacity-50 absolute">{mark.format('MMMM YYYY')}</span> }
              <span>{date}</span>
            </div>)
          })
        }
      </div>
      {/* ========= calendar header end ========= */}

      {/* ========== calendar content start ========= */}
      <div className="calendar__content whitespace-nowrap relative" style={{ height: groupHeightCount + 'px' }}>
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
              <div className="calendar__group w-fit">
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
                    const { coordinates, size } = event
                    return (
                      <div
                        className="calendar__event absolute bg-white rounded cursor-pointer single_ellipsis"
                        style={{
                          left: coordinates.x,
                          top: coordinates.y + SIDEBAR_GROUP_TITLE_HEIGHT,
                          width: size.width + 'px',
                          height: size.height + 'px',
                        }}
                      >
                        {event.title}
                      </div>
                    )
                  })
                }
                {/* ===== calendar event end ==== */}
                {/* ===== calendar milestone start ==== */}
                {
                  group.milestones?.map(milestone => {
                    const { coordinates } = milestone
                    return (
                      <>
                        <div className="calendar__milestone__line absolute" style={{ left: coordinates.x + CALENDAR_EVENT_WIDTH / 2, top: group.coordinate.y, height: group.height + 16 }}>
                          {/* <span className="absolute ml-3">{milestone.title}</span> */}
                        </div>
                        <div className="calendar__milestone__text absolute flex items-center cursor-pointer" style={{ left: coordinates.x + 2 + CALENDAR_EVENT_WIDTH / 2, top: coordinates.y + SIDEBAR_GROUP_TITLE_HEIGHT }}>
                          <span className="single_ellipsis">{milestone.title}</span>
                        </div>
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

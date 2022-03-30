import React, { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { extractDays, getXCoordinate, isWeekend, getDataWithGroupCoordinates } from '../util'
import { IGroup } from '../type'

const Calendar: React.FC<{
  data: IGroup[]
}> = ({ data }) => {
  const current = dayjs()
  // TODO: 开始日期设置为2个月前, 结束日期设置为4个月后
  const start = current.startOf('month').subtract(1, 'month')
  const end = current.endOf('month').add(1, 'month')

  const [scale, setScale] = useState('day')
  const [dateMarks, setDateMarks] = useState(extractDays(start, end))

  const dataWithGroupCoordinate = getDataWithGroupCoordinates(data)
  const dataWithHeight = data.map(group => {
    const { events, milestones = [] } = group
    const height = (events.length + milestones.length) * 40 +22
    return {
      ...group,
      height,
    }
  })
  const groupHeightCount = dataWithHeight.reduce((acc, cur) => acc + cur.height, 0)
  const dataWithCoordinates = dataWithGroupCoordinate.map((group, groupIndex) => {
    return {
      ...group,
      eventCount: group.events.concat(group.milestones || []).length,
      events: group.events.map((event, eventIndex) => {
        return {
          ...event,
          coordinates: {
            x: getXCoordinate(start, dayjs(event.start)),
            y: group.coordinate.y + eventIndex * 40,
          },
        }
      }),
    }
  })

  useEffect(() => {
    document.querySelector(`#date${dayjs().format('YYYYMMDD')}`)?.scrollIntoView({ block: 'nearest', inline: 'center' })
  }, [])

  return (
    <div className="calendar flex-1 overflow-auto h-fit relative">

      <div className="calendar__header w-fit whitespace-nowrap bg-white absolute top-0">
        {
          dateMarks.map((mark, index) => {
            const date = mark.format('DD')
            const month = mark.format('MM')
            const _isWeekend = isWeekend(mark)
            return (<div className="date relative text-center" id={'date' + mark.format('YYYYMMDD')}>
              { date === '01' ? <span className="date__month absolute opacity-50">{month === '01' ? mark.format('YYYY-MM') : `Month ${month}`}</span> : null }
              <span className={`${_isWeekend ? 'weekend' : ''}`}>{mark.format('DD')}</span>
            </div>)
          })
        }
      </div>

      <div className="calendar__content w-fit whitespace-nowrap relative" style={{ height: groupHeightCount + 'px' }}>
        <div className="h-full absolute">
          {
            dateMarks.map((mark, index) => {
              const _isWeekend = isWeekend(mark)
              const isToday = mark.isSame(current, 'day')
              return (<div className={`calendar__content__back ${_isWeekend ? 'weekend' : ''} ${isToday ? 'today' : ''}`}></div>)
            })
          }
        </div>
        {
          dataWithCoordinates.map(group => {
            return (
              <div className="calendar__group">
                {
                  group.events.map(event => {
                    const { coordinates } = event
                    return (
                      <div className="calendar__event absolute bg-white rounded cursor-pointer" style={{ left: coordinates.x, top: coordinates.y }}>{event.title}</div>
                    )
                  })
                }
              </div>
            )
          })
        }
      </div>
    </div>
  )
}

export default Calendar

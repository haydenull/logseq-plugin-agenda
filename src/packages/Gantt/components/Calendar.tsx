import React, { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { extractDays, getXCoordinate, isWeekend } from '../util'
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

  const dataWithCoordinates = data.map(item => {
    return {
      ...item,
      events: item.events.map(event => {
        return {
          ...event,
          coordinates: {
            x: getXCoordinate(start, dayjs(event.start)),
            y: 0,
          },
        }
      }),
    }
  })

  useEffect(() => {
    document.querySelector(`#date${dayjs().format('YYYYMMDD')}`)?.scrollIntoView()
  }, [])

  return (
    <div className="calendar flex-1 overflow-auto">
      {/* <div className="h-full absolute -z-10">
        {
          dateMarks.map((mark, index) => {
            const _isWeekend = isWeekend(mark)
            return (<div className={`calendar__content__back ${_isWeekend ? 'weekend' : ''}`}></div>)
          })
        }
      </div> */}
      <div className="calendar__header w-fit whitespace-nowrap bg-white">
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

      <div className="calendar__content w-fit whitespace-nowrap relative">
        {
          dataWithCoordinates.map(group => {
            return (
              <div className="calendar__group">
                {
                  group.events.map(event => {
                    const { coordinates } = event
                    return (
                      <div className="calendar__event absolute bg-white rounded" style={{ left: coordinates.x, top: coordinates.y }}>{event.title}</div>
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

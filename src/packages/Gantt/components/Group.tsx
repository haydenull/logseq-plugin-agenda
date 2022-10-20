import dayjs from 'dayjs'
import React from 'react'
import { IoIosArrowUp, IoIosArrowDown} from 'react-icons/io'
import { IEvent, IMode } from '../type'
import { scrollToDate } from '../util'

const Group: React.FC<{
  groupId?: string
  groupName: string
  events: IEvent[]
  milestones?: IEvent[]
  levelCount?: number
  uniqueId?: string
  mode: IMode
  foldedGroups?: string[]
  onFoldChange?: (groupId: string, fold: boolean) => void
}> = ({ groupId, groupName, events, milestones = [], mode, levelCount = 0, uniqueId = '', foldedGroups, onFoldChange }) => {

  const isFold = foldedGroups?.includes(groupId || '')
  const onFold = (fold: boolean) => onFoldChange?.(groupId || '', fold)


  return (
    <div className="group rounded-sm">
      <div className="group__title sticky bg-quaternary title-text single_ellipsis" title={groupName}>
        {isFold ? <IoIosArrowDown onClick={() => onFold?.(false)} className="ml-2" /> : <IoIosArrowUp onClick={() => onFold(true)} className="ml-2" />}
        {groupName}
      </div>
      {
        !isFold && (
          <div className="group__content">
            {
              mode === 'simple'
              ? new Array(levelCount).fill(0).map((_, index) => (
                <div className="group__event cursor-pointer"></div>
              ))
              : events.map((event) => (
                <div className="group__event cursor-pointer single_ellipsis" onClick={() => scrollToDate(dayjs(event.start), uniqueId)}>
                  {event?.title}
                </div>
              ))
            }
            {
              mode === 'simple'
              ? (milestones?.length > 0 ? <div className="group__event cursor-pointer flex justify-between items-center">{/* Milestones */}</div> : null)
              : milestones?.map((milestone, index) => (
                <div className="group__event cursor-pointer single_ellipsis milestone" onClick={() => scrollToDate(dayjs(milestone.start), uniqueId)}>
                  {milestone?.title}
                </div>
              ))
            }
          </div>
        )
      }
    </div>
  )
}

export default Group

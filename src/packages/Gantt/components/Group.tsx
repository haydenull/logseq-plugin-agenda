import dayjs from 'dayjs'
import React from 'react'
import { BsCaretRightFill, BsCaretDownFill } from 'react-icons/bs'
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
    <div className="group rounded-sm min-h-full">
      <div
        className="group__title sticky bg-quaternary title-text z-10 flex items-center cursor-pointer"
        title={groupName}
        onClick={() => onFold?.(isFold ? false : true)}
      >
        {isFold ? <BsCaretRightFill className="shrink-0"/> : <BsCaretDownFill className="shrink-0"/>}
        <span className="single_ellipsis">{groupName}</span>
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

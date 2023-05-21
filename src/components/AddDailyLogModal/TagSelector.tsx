import type { ILogTag } from '@/util/type'
import classnames from 'classnames'
import React from 'react'
import { BsCheckLg } from 'react-icons/bs'
import s from './index.module.less'

const TagSelector: React.FC<{
  options: ILogTag[]
  value?: ILogTag['id']
  onChange: (val: ILogTag['id']) => void
}> = ({ options, value, onChange }) => {
  return (
    <div className={classnames(s.tagContainer, 'flex-1 flex-col ml-6')}>
      {options.map((item) => (
        <div
          key={item.id}
          className={classnames({ [s.tagActive]: value === item.id }, s.tag)}
          style={{ backgroundColor: item.bgColor, color: item.textColor }}
          onClick={() => onChange(item.id)}
          title={item.id}
        >
          <div className="singlge-line-ellipsis flex-1">{item.id}</div>
          <div style={{ backgroundColor: item.textColor, color: item.bgColor }} className={classnames(s.tagMarker)}>
            <BsCheckLg />
          </div>
        </div>
      ))}
    </div>
  )
}

export default TagSelector

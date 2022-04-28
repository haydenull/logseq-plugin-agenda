import React, { useEffect, useState } from 'react'
import { FaPowerOff } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'

import logo from '@/assets/logo.png'
import SiderTabs from '@/components/SiderTabs'
import { MENUS } from '@/constants/elements'
import s from './index.module.less'

const index: React.FC<{}> = () => {
  const navigate = useNavigate()

  const onRouteChange = (value: string) => {
    const { path } = MENUS.find(item => item.value === value) || { path: '/' }
    navigate(path)
  }

  useEffect(() => {
    // navigate('/calendar')
  }, [])

  return (
    <div className={s.container}>
      <div className={s.logo}>
        {/* <img src={logo} /> */}
      </div>

      <SiderTabs tabs={MENUS} onChange={onRouteChange} />

      <div className={s.close} onClick={() => logseq.hideMainUI()}><FaPowerOff /></div>
    </div>
  )
}

export default index

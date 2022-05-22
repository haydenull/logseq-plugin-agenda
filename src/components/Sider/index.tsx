import React, { useEffect, useState } from 'react'
import { FaPowerOff } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'

import logo from '@/assets/logo.png'
import SiderTabs from '@/components/SiderTabs'
import { MENUS } from '@/constants/elements'
import s from './index.module.less'
import { DEFAULT_SETTINGS } from '@/util/constants'
import { getInitalSettings } from '@/util/baseInfo'

const index: React.FC<{
  defaultRoute?: string
}> = ({ defaultRoute }) => {
  const navigate = useNavigate()
  const { homePage = DEFAULT_SETTINGS.homePage } = getInitalSettings()

  const onRouteChange = (value: string) => {
    const { path } = MENUS.find(item => item.value === value) || { path: '/' }
    navigate(path)
  }

  useEffect(() => {
    if (defaultRoute) navigate(defaultRoute)
  }, [defaultRoute])

  return (
    <div className={s.container}>
      <div className={s.logo}>
        <img src={logo} />
      </div>
      {/* <div className="mb-28"></div> */}

      <SiderTabs tabs={MENUS} onChange={onRouteChange} initialValue={homePage} />

      <div className={s.close} onClick={() => logseq.hideMainUI()}><FaPowerOff /></div>
    </div>
  )
}

export default index

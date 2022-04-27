import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sider from '@/components/Sider'
import Dashboard from '@/pages/Dashboard'
import { MENUS } from '@/constants/elements'
import { listenEsc } from '@/util/util'

const App: React.FC<{}> = () => {

  useEffect(() => {
    const callback = () => logseq.hideMainUI()
    listenEsc(callback)
    return () => {
      document.removeEventListener('keyup', callback)
    }
  }, [])

  return (
    <main className="w-screen h-screen flex">
      <BrowserRouter>
        <Sider />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          {
            MENUS.map(item => (
              <Route path={item.path} element={item.element} key={item.value} />
            ))
          }
        </Routes>
      </BrowserRouter>
    </main>
  )
}

export default App

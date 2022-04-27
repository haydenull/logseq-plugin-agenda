import React from 'react'

import Dispatcher from './dispatcher'
import VeloContext from './context'
import Exector from './Exector'

const dispatcher = new Dispatcher()

const Provider = ({
  models,
  children
}: {
  models: Record<string, () => any>
  children: React.ReactNode
}) => {
  return (
    <VeloContext.Provider value={dispatcher}>
      {
        Object.keys(models).map(namespace => {
          const hook = models[namespace]
          return (
            <Exector
              key={namespace}
              namespace={namespace}
              hook={hook}
              onUpdate={(data: any) => {
                dispatcher.data[namespace] = data
                dispatcher.update(namespace)
              }}
            />
          )
        })
      }
      {children}
    </VeloContext.Provider>
  )
}

export default Provider

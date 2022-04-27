import { useState, useRef, useContext, useEffect } from 'react'

import VeloContext from './context'

const useModel= (namespace: string) => {
  const dispatcher = useContext<any>(VeloContext)

  const [state, setState] = useState(() => dispatcher.data[namespace])

  const isMount = useRef(false)
  useEffect(() => {
    isMount.current = true
    return () => {
      isMount.current = false
    }
  }, [])

  useEffect(() => {
    const handler = (data: any) => {
      if (isMount.current) {
        setState(data)
      } else {
        setTimeout(() => {
          dispatcher.data[namespace] = data
          dispatcher.update(namespace)
        })
      }
    }

    if (dispatcher.callbacks?.[namespace] === undefined) dispatcher.callbacks[namespace] = new Set()
    dispatcher.callbacks[namespace].add(handler)
    dispatcher.update(namespace)

    return () => {
      dispatcher.callbacks?.[namespace]?.delete(handler)
    }
  }, [namespace])

  return state
}

export default useModel

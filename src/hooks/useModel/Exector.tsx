import { useEffect, useRef, useMemo } from 'react'

type IExectorProps = {
  namespace: string
  hook: () => any
  onUpdate: (data: any) => void
}

const Exector = ({ namespace, hook, onUpdate }: IExectorProps) => {
  const onUpdateRef = useRef(onUpdate)
  onUpdateRef.current = onUpdate
  const initialLoad = useRef(false)

  let data: any
  try {
    data = hook()
  } catch (error) {
    console.error(`=== [velo:] Invoking ${namespace} model failed`, error)
  }

  // useMemo 可以在 App 执行前初始化, useEffect 则不行
  useMemo(() => {
    console.log('[faiz:] === Exector useMemo ===', namespace)
    onUpdateRef.current(data)
    initialLoad.current = false
  }, [])

  useEffect(() => {
    onUpdateRef.current(data)
    console.log('[faiz:] === Exector useEffect ===', namespace)
  })

  return <></>
}

export default Exector

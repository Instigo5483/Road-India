import { startTransition, useCallback, useEffect, useRef, useState } from 'react'
import { createHomeLoadOrder } from './homeLoadOrder'

export function useHomeLoadOrder() {
  const [stage, setStage] = useState(0)
  const order = useRef(null)
  useEffect(() => {
    const current = createHomeLoadOrder({
      onMap: () => setStage(1),
      onRest: () => startTransition(() => setStage(2)),
    })
    order.current = current
    return () => { current.dispose(); order.current = null }
  }, [])
  const mapReady = useCallback(() => order.current?.mapReady(), [])
  return { stage, mapReady }
}

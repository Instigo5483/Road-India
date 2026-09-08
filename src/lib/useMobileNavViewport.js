import { useEffect, useRef } from 'react'
import { followMobileViewport } from './mobileNavViewport'

export function useMobileNavViewport() {
  const ref = useRef(null)
  useEffect(() => followMobileViewport(ref.current), [])
  return ref
}

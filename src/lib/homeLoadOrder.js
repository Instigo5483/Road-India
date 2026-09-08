// Two animation frames leave a paint opportunity for the usable report button
// before requesting map code. A fallback also handles background tabs.
export function afterHomePaint(callback, host = window) {
  let first, second, finished = false
  const finish = () => {
    if (finished) return
    finished = true
    host.cancelAnimationFrame(first)
    host.cancelAnimationFrame(second)
    host.clearTimeout(timer)
    callback()
  }
  const timer = host.setTimeout(finish, 1000)
  first = host.requestAnimationFrame(() => { second = host.requestAnimationFrame(finish) })
  return () => {
    finished = true
    host.cancelAnimationFrame(first)
    host.cancelAnimationFrame(second)
    host.clearTimeout(timer)
  }
}

export function createHomeLoadOrder({ onMap, onRest }, host = window) {
  let disposed = false, mapStarted = false, restQueued = false
  let cancelRestPaint = () => {}, idle, fallback
  const runRest = () => { if (!disposed) onRest() }
  const mapReady = () => {
    if (disposed || !mapStarted || restQueued) return
    restQueued = true
    host.clearTimeout(fallback)
    cancelRestPaint = afterHomePaint(() => {
      idle = host.requestIdleCallback
        ? host.requestIdleCallback(runRest, { timeout: 1000 })
        : host.setTimeout(runRest, 0)
    }, host)
  }
  const cancelMapPaint = afterHomePaint(() => {
    if (disposed) return
    mapStarted = true
    onMap()
    // A slow chunk, unavailable tiles or failed map must not hide the rest.
    fallback = host.setTimeout(mapReady, 4000)
  }, host)
  return {
    mapReady,
    dispose() {
      disposed = true
      cancelMapPaint()
      cancelRestPaint()
      host.clearTimeout(fallback)
      if (host.requestIdleCallback) host.cancelIdleCallback(idle)
      else host.clearTimeout(idle)
    },
  }
}

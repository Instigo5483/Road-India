// Hide the whole marker pane synchronously: React may not finish replacing
// individual markers before Leaflet paints the next animation frame.
export function guardPinsDuringZoom(map, minimumZoom = 0) {
  const panes = ['markerPane', 'tooltipPane'].map(name => {
    const pane = map.getPane(name)
    return { pane, visibility: pane.style.visibility }
  })
  const container = map.getContainer()
  let timer
  let zooming = false

  const restore = () => {
    for (const { pane, visibility } of panes) {
      pane.style.visibility = pane === map.getPane('markerPane') && map.getZoom() < minimumZoom ? 'hidden' : visibility
    }
  }
  restore()

  const hide = () => {
    clearTimeout(timer)
    for (const { pane } of panes) pane.style.visibility = 'hidden'
  }
  const revealAfterSettling = () => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      if (!zooming) restore()
    }, 180)
  }
  const onWheel = () => {
    hide()
    // Also restore pins when scrolling at the zoom limit produces no zoomend.
    revealAfterSettling()
  }
  const onZoomStart = () => { zooming = true; hide() }
  const onZoomEnd = () => { zooming = false; revealAfterSettling() }
  container.addEventListener('wheel', onWheel, { passive: true, capture: true })
  map.on('zoomstart', onZoomStart)
  map.on('zoomend', onZoomEnd)

  return () => {
    clearTimeout(timer)
    container.removeEventListener('wheel', onWheel, true)
    map.off('zoomstart', onZoomStart)
    map.off('zoomend', onZoomEnd)
    for (const { pane, visibility } of panes) pane.style.visibility = visibility
  }
}

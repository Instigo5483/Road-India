// A mobile preview or browser toolbar can leave the visual viewport shorter
// than the layout viewport that position:fixed uses for its bottom edge.
export function followMobileViewport(element, host = window) {
  const viewport = host.visualViewport
  const originalBottom = element.style.bottom
  const update = () => {
    const inset = viewport ? Math.max(0, host.innerHeight - viewport.height - viewport.offsetTop) : 0
    element.style.bottom = `${inset}px`
  }
  update()
  host.addEventListener('resize', update)
  viewport?.addEventListener('resize', update)
  viewport?.addEventListener('scroll', update)
  return () => {
    host.removeEventListener('resize', update)
    viewport?.removeEventListener('resize', update)
    viewport?.removeEventListener('scroll', update)
    element.style.bottom = originalBottom
  }
}

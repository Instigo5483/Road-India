import test from 'node:test'
import assert from 'node:assert/strict'
import { guardPinsDuringZoom } from '../src/lib/pinZoomVisibility.js'

function fixture(t, minimumZoom = 0) {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const pane = { style: { visibility: '' } }
  const tooltip = { style: { visibility: '' } }
  const container = new EventTarget()
  const handlers = new Map()
  let zoom = 14
  const map = {
    getZoom: () => zoom,
    getPane: name => name === 'markerPane' ? pane : tooltip, getContainer: () => container,
    on: (name, handler) => handlers.set(name, handler),
    off: name => handlers.delete(name),
  }
  const dispose = guardPinsDuringZoom(map, minimumZoom)
  t.after(dispose)
  return { pane, tooltip, handlers, dispose,
    setZoom: value => { zoom = value },
    wheel: () => container.dispatchEvent(new Event('wheel')),
    emit: name => handlers.get(name)?.(),
    tick: time => t.mock.timers.tick(time),
  }
}

test('rapid consecutive zooms keep pins hidden until the final zoom settles', t => {
  const f = fixture(t)
  f.wheel()
  assert.equal(f.pane.style.visibility, 'hidden')
  assert.equal(f.tooltip.style.visibility, 'hidden')
  f.emit('zoomstart')
  f.tick(500)
  assert.equal(f.pane.style.visibility, 'hidden')
  f.emit('zoomend')
  f.tick(100)
  f.wheel()
  f.emit('zoomstart')
  f.tick(200)
  assert.equal(f.pane.style.visibility, 'hidden')
  f.emit('zoomend')
  f.tick(179)
  assert.equal(f.pane.style.visibility, 'hidden')
  f.tick(1)
  assert.equal(f.pane.style.visibility, '')
  assert.equal(f.tooltip.style.visibility, '')
})

test('zooming out of street view keeps markers hidden after settling but restores boundary tooltips', t => {
  const f = fixture(t, 14)
  f.emit('zoomstart')
  f.setZoom(13)
  f.emit('zoomend')
  f.tick(180)
  assert.equal(f.pane.style.visibility, 'hidden')
  assert.equal(f.tooltip.style.visibility, '')
  f.wheel()
  f.tick(180)
  assert.equal(f.pane.style.visibility, 'hidden')
  f.emit('zoomstart')
  f.setZoom(14)
  f.emit('zoomend')
  f.tick(180)
  assert.equal(f.pane.style.visibility, '')
})

test('explicit pin display modes still show pins at wider zoom levels', t => {
  const f = fixture(t)
  f.emit('zoomstart')
  f.setZoom(6)
  f.emit('zoomend')
  f.tick(180)
  assert.equal(f.pane.style.visibility, '')
})

test('wheel scrolling at a zoom limit does not leave report pins hidden', t => {
  const f = fixture(t)
  f.wheel()
  f.tick(150)
  f.wheel()
  f.tick(150)
  assert.equal(f.pane.style.visibility, 'hidden')
  f.tick(30)
  assert.equal(f.pane.style.visibility, '')
})

test('unmount cancels pending updates and restores the marker pane', t => {
  const f = fixture(t)
  f.emit('zoomstart')
  f.emit('zoomend')
  f.dispose()
  assert.equal(f.handlers.size, 0)
  assert.equal(f.pane.style.visibility, '')
  f.pane.style.visibility = 'collapse'
  f.tick(500)
  assert.equal(f.pane.style.visibility, 'collapse')
})

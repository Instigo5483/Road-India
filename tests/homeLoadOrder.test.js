import test from 'node:test'
import assert from 'node:assert/strict'
import { createHomeLoadOrder } from '../src/lib/homeLoadOrder.js'

function fixture(t, idleSupported = true) {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  let nextId = 0
  const frames = new Map(), idle = new Map(), events = []
  const host = {
    setTimeout, clearTimeout,
    requestAnimationFrame(callback) { const id = ++nextId; frames.set(id, callback); return id },
    cancelAnimationFrame(id) { frames.delete(id) },
    ...(idleSupported ? {
      requestIdleCallback(callback) { const id = ++nextId; idle.set(id, callback); return id },
      cancelIdleCallback(id) { idle.delete(id) },
    } : {}),
  }
  const order = createHomeLoadOrder({ onMap: () => events.push('map'), onRest: () => events.push('rest') }, host)
  t.after(() => order.dispose())
  const flush = queue => { const pending = [...queue.values()]; queue.clear(); pending.forEach(callback => callback()) }
  return { order, events, frame: () => flush(frames), idle: () => flush(idle), tick: ms => t.mock.timers.tick(ms) }
}

test('the report shell gets a paint opportunity before map work; secondary work waits for the map', t => {
  const f = fixture(t)
  assert.deepEqual(f.events, [])
  f.frame()
  assert.deepEqual(f.events, [])
  f.frame()
  assert.deepEqual(f.events, ['map'])
  f.tick(500)
  assert.deepEqual(f.events, ['map'])
  f.order.mapReady()
  f.frame(); f.frame()
  assert.deepEqual(f.events, ['map'])
  f.idle()
  assert.deepEqual(f.events, ['map', 'rest'])
  f.order.mapReady(); f.tick(10000); f.frame(); f.idle()
  assert.deepEqual(f.events, ['map', 'rest'], 'repeat tile loads must not schedule the rest twice')
})

test('a stalled map cannot indefinitely hide the other sections', t => {
  const f = fixture(t)
  f.frame(); f.frame()
  f.tick(3999)
  assert.deepEqual(f.events, ['map'])
  f.tick(1); f.frame(); f.frame(); f.idle()
  assert.deepEqual(f.events, ['map', 'rest'])
})

test('background tabs and browsers without idle callbacks still load in order', t => {
  const f = fixture(t, false)
  f.tick(1000)
  assert.deepEqual(f.events, ['map'])
  f.order.mapReady()
  f.tick(1000); f.tick(1)
  assert.deepEqual(f.events, ['map', 'rest'])
})

test('leaving the page cancels map work before it starts', t => {
  const f = fixture(t)
  f.order.dispose()
  f.frame(); f.tick(10000); f.idle()
  assert.deepEqual(f.events, [])
})

test('leaving during map loading cancels the fallback and pending idle work', t => {
  const f = fixture(t)
  f.frame(); f.frame()
  f.order.mapReady(); f.frame(); f.frame()
  f.order.dispose()
  f.idle(); f.tick(10000)
  assert.deepEqual(f.events, ['map'])
})

import test from 'node:test'
import assert from 'node:assert/strict'
import { followMobileViewport } from '../src/lib/mobileNavViewport.js'

test('mobile navigation stays at the visible bottom when preview height and offset change', () => {
  const host = new EventTarget()
  host.innerHeight = 1000
  const viewport = Object.assign(new EventTarget(), { height: 850, offsetTop: 0 })
  host.visualViewport = viewport
  const element = { style: { bottom: '' } }
  const cleanup = followMobileViewport(element, host)
  assert.equal(element.style.bottom, '150px')
  viewport.height = 600
  viewport.offsetTop = 50
  viewport.dispatchEvent(new Event('resize'))
  assert.equal(element.style.bottom, '350px')
  viewport.offsetTop = 100
  viewport.dispatchEvent(new Event('scroll'))
  assert.equal(element.style.bottom, '300px')
  host.innerHeight = 600
  host.dispatchEvent(new Event('resize'))
  assert.equal(element.style.bottom, '0px')
  cleanup()
  assert.equal(element.style.bottom, '')
  viewport.dispatchEvent(new Event('resize'))
  host.dispatchEvent(new Event('resize'))
  assert.equal(element.style.bottom, '')
})

test('browsers without a visual viewport keep standard fixed-bottom navigation', () => {
  const host = Object.assign(new EventTarget(), { innerHeight: 850 })
  const element = { style: { bottom: '' } }
  const cleanup = followMobileViewport(element, host)
  assert.equal(element.style.bottom, '0px')
  cleanup()
})

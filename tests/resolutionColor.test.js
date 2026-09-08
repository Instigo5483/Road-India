import test from 'node:test'
import assert from 'node:assert/strict'
import { resolutionColor } from '../src/lib/resolutionColor.js'

const channels = rate => resolutionColor(rate).match(/[\d.]+/g).map(Number)

test('resolution circles stay red below 50% and turn green at exactly 50%', () => {
  for (const rate of [0, 25, 49, 49.99, 49.999999]) {
    const [red, green, blue] = channels(rate)
    assert.ok(red > green && red > blue)
  }
  for (const rate of [50, 50.000001, 75, 100]) {
    const [red, green, blue] = channels(rate)
    assert.ok(green > red && green > blue)
  }
})

test('nearby percentages interpolate smoothly instead of sharing color bands', () => {
  for (const start of [12, 62]) {
    const colors = Array.from({ length: 101 }, (_, i) => resolutionColor(start + i / 100))
    assert.equal(new Set(colors).size, colors.length)
    const first = channels(start)
    const next = channels(start + 0.01)
    assert.ok(first.every((value, index) => Math.abs(value - next[index]) < 0.1))
  }
})

test('red softens toward 50% and green strengthens toward 100%', () => {
  assert.ok(channels(0)[1] < channels(25)[1])
  assert.ok(channels(25)[1] < channels(49.99)[1])
  const greenStrength = rate => { const [red, green] = channels(rate); return green - red }
  assert.ok(greenStrength(50) < greenStrength(75))
  assert.ok(greenStrength(75) < greenStrength(100))
})

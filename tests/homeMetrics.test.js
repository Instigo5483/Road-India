import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateHomeMetrics, fetchHomeMetrics } from '../src/lib/homeMetrics.js'

test('home metrics include legacy categories, unique cities and only resolved ratings', () => {
  const reports = [
    { category: 'issue', status: 'resolved', location: { city: 'Delhi' }, citizenFeedback: { rating: 4 } },
    { category: 'problem', status: 'resolved', location: { city: 'Delhi' }, citizenFeedback: { rating: 5 } },
    { category: 'corruption', status: 'submitted', location: { city: 'Kolkata' }, citizenFeedback: { rating: 1 } },
    { category: 'issue', status: 'resolved' },
    { category: 'retired', status: 'resolved', location: { city: 'Mumbai' }, citizenFeedback: { rating: 1 } },
  ]
  assert.deepEqual(calculateHomeMetrics(reports), { filed: 4, resolved: 3, cities: 2, satisfaction: 90 })
  assert.deepEqual(calculateHomeMetrics([]), { filed: 0, resolved: 0, cities: 0, satisfaction: 0 })
})

test('lightweight query excludes photos and decodes projected Firestore metrics', async t => {
  const signal = new AbortController().signal
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.match(url, /^https:\/\/firestore.googleapis.com\/v1\/projects\/demo\/databases\/\(default\)\/documents:runQuery\?key=public-key$/)
    assert.equal(options.signal, signal)
    const { structuredQuery } = JSON.parse(options.body)
    assert.deepEqual(structuredQuery.select.fields.map(field => field.fieldPath), ['category', 'status', 'location.city', 'citizenFeedback.rating'])
    assert.equal(structuredQuery.orderBy[0].field.fieldPath, 'createdAt')
    return { ok: true, json: async () => [
      { document: { fields: {
        category: { stringValue: 'issue' }, status: { stringValue: 'resolved' },
        location: { mapValue: { fields: { city: { stringValue: 'Delhi' } } } },
        citizenFeedback: { mapValue: { fields: { rating: { integerValue: '4' } } } },
      } } },
      { document: { fields: { category: { stringValue: 'problem' }, status: { stringValue: 'submitted' } } } },
      { readTime: '2026-09-08T00:00:00Z' },
    ] }
  })
  assert.deepEqual(await fetchHomeMetrics({ projectId: 'demo', apiKey: 'public-key', signal }), { filed: 2, resolved: 1, cities: 1, satisfaction: 80 })
})

test('empty database returns zero metrics and REST failures reject for live fallback', async t => {
  const options = { projectId: 'demo', apiKey: 'public-key', emulator: true }
  const mocked = t.mock.method(globalThis, 'fetch', async url => {
    assert.match(url, /^http:\/\/localhost:8080\//)
    return { ok: true, json: async () => [{ readTime: '2026-09-08T00:00:00Z' }] }
  })
  assert.deepEqual(await fetchHomeMetrics(options), { filed: 0, resolved: 0, cities: 0, satisfaction: 0 })
  mocked.mock.mockImplementation(async () => ({ ok: false }))
  await assert.rejects(fetchHomeMetrics(options), /Could not load/)
  mocked.mock.mockImplementation(async () => ({ ok: true, json: async () => [{ error: { code: 403 } }] }))
  await assert.rejects(fetchHomeMetrics(options), /Invalid home metrics/)
})

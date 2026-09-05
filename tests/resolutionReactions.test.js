import test from 'node:test'
import assert from 'node:assert/strict'
import { reactionPatch, reactionCounts } from '../src/lib/resolutionReactions.js'

test('resolved reactions can be added, switched and removed without changing others', () => {
  const original = { status: 'resolved', resolutionReactions: { other: 'false' }, citizenFeedback: { rating: 5 } }
  const added = { ...original, ...reactionPatch(original, 'me', 'true') }
  assert.deepEqual(reactionCounts(added), { true: 1, false: 1 })
  const switched = { ...added, ...reactionPatch(added, 'me', 'false') }
  assert.deepEqual(reactionCounts(switched), { true: 0, false: 2 })
  assert.deepEqual(reactionPatch(switched, 'me', 'false').resolutionReactions, { other: 'false' })
  assert.deepEqual(original.resolutionReactions, { other: 'false' })
  assert.deepEqual(added.citizenFeedback, { rating: 5 })
})

test('legacy resolved reports start with zero votes; invalid reactions and open reports fail', () => {
  assert.deepEqual(reactionCounts({}), { true: 0, false: 0 })
  assert.deepEqual(reactionPatch({ status: 'resolved' }, 'me', 'true'), { resolutionReactions: { me: 'true' } })
  for (const status of ['submitted', 'in_review', 'in_progress']) assert.throws(() => reactionPatch({ status }, 'me', 'true'))
  assert.throws(() => reactionPatch(null, 'me', 'true'))
  assert.throws(() => reactionPatch({ status: 'resolved' }, '', 'true'))
  assert.throws(() => reactionPatch({ status: 'resolved' }, 'me', 'invalid'))
})

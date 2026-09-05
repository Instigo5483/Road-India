// Community opinion never changes administrative status or the author's review.
export function reactionPatch(report, uid, reaction) {
  if (!uid || !report || report.status !== 'resolved' || !['true', 'false'].includes(reaction)) throw new Error('Invalid resolution reaction')
  const resolutionReactions = { ...(report.resolutionReactions ?? {}) }
  if (resolutionReactions[uid] === reaction) delete resolutionReactions[uid]
  else resolutionReactions[uid] = reaction
  return { resolutionReactions }
}

export function reactionCounts(report) {
  const values = Object.values(report.resolutionReactions ?? {})
  return { true: values.filter(v => v === 'true').length, false: values.filter(v => v === 'false').length }
}

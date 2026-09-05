export function hasValidLocation(location) {
  return Boolean(location && Number.isFinite(location.lat) && Number.isFinite(location.lng) &&
    location.lat >= -90 && location.lat <= 90 && location.lng >= -180 && location.lng <= 180)
}

export function upvotePatch(report, uid) {
  const voters = Array.isArray(report.upvotedBy) ? report.upvotedBy : []
  const already = voters.includes(uid)
  return {
    upvotedBy: already ? voters.filter(id => id !== uid) : [...voters, uid],
    upvotes: Math.max(0, (Number.isFinite(report.upvotes) ? report.upvotes : voters.length) + (already ? -1 : 1)),
  }
}

export function assertEditable(report, uid) {
  if (!report || report.createdBy !== uid || !['submitted', 'in_review'].includes(report.status)) {
    throw new Error('Report is not editable')
  }
}

export function validateContent({ description, photoUrls, location }) {
  if (typeof description !== 'string' || !description.trim() || description.length > 5000 ||
      !Array.isArray(photoUrls) || photoUrls.length > 3 ||
      photoUrls.some(src => typeof src !== 'string' || !/^data:image\/(jpeg|png|webp);base64,/.test(src) || src.length > 240000) ||
      !hasValidLocation(location)) throw new Error('Invalid report content')
}

export function validateFeedback(report, uid, feedback) {
  if (!report || report.createdBy !== uid || report.status !== 'resolved' || report.citizenFeedback ||
      !Number.isInteger(feedback.rating) || feedback.rating < 1 || feedback.rating > 5 ||
      typeof feedback.confirmedResolved !== 'boolean' || typeof feedback.review !== 'string' ||
      feedback.review.length > 2000) throw new Error('Invalid or duplicate resolution feedback')
}

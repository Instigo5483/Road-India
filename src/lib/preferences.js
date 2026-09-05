export const DEFAULT_PREFERENCES = {
  visibility: 'first_initial', showBadge: true, showRank: true,
  offlineDrafts: false, compressPhotos: true, geoHistory: false, rating: 0,
}

export function publicName(name, visibility = 'first_initial') {
  if (visibility === 'anonymous') return 'Anonymous citizen'
  if (visibility === 'legal_name') return name || 'Citizen'
  const parts = (name || 'Citizen').trim().split(/\s+/)
  return parts.length > 1 ? `${parts[0]} ${parts.at(-1)[0]}.` : parts[0]
}

export const draftKey = uid => `road_india_draft_${uid}`
export const historyKey = uid => `road_india_locations_${uid}`
export function readLocal(key, fallback = null) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key))
    if (parsed == null) return fallback
    if (Array.isArray(fallback)) return Array.isArray(parsed) ? parsed : fallback
    if (fallback && typeof fallback === 'object') return typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : fallback
    return parsed
  } catch { return fallback }
}
export function downloadJson(name, data) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

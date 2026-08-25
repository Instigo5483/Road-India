// Response-team types and which ones get dispatched for each emergency
// report type. Mirrored in functions/index.js (the Cloud Function that
// actually does the dispatch) -- Cloud Functions live in a separate
// deployable package with its own dependencies, so this small, stable
// mapping is duplicated there rather than pulled in through shared tooling.
// Keep both in sync if you add a team type or emergency type.

export const TEAM_TYPES = [
  { id: 'ambulance', labelKey: 'team.type.ambulance' },
  { id: 'doctor', labelKey: 'team.type.doctor' },
  { id: 'fire', labelKey: 'team.type.fire' },
  { id: 'police', labelKey: 'team.type.police' },
  { id: 'tow', labelKey: 'team.type.tow' },
]

export function getTeamType(id) {
  return TEAM_TYPES.find((t) => t.id === id)
}

// Keys match CATEGORIES.emergency.types ids in data/categoryTypes.js.
export const REQUIRED_TEAMS_BY_EMERGENCY_TYPE = {
  accident: ['ambulance', 'doctor'],
  road_clash: ['police'],
  vehicle_breakdown: ['tow'],
  fire_hazard: ['fire'],
  medical_emergency: ['ambulance', 'doctor'],
  other: ['police'],
}

export function getRequiredTeamTypes(emergencyType) {
  return REQUIRED_TEAMS_BY_EMERGENCY_TYPE[emergencyType] ?? ['police']
}

export const TEAM_STATUSES = [
  { id: 'available', labelKey: 'team.status.available', theme: 'success' },
  { id: 'busy', labelKey: 'team.status.busy', theme: 'warning' },
  { id: 'offline', labelKey: 'team.status.offline', theme: 'ink' },
]

export function getTeamStatus(id) {
  return TEAM_STATUSES.find((s) => s.id === id) ?? TEAM_STATUSES[2]
}

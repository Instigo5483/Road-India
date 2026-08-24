// The three top-level report categories and their category-specific
// "type" dropdown options. Every label is an i18n key resolved through
// LanguageContext's t() so the whole flow works in any supported language.
//
// `theme` keys map to Tailwind color families defined in tailwind.config.js
// (accent = orange for everyday problems, brand = blue for civic
// infrastructure grievances, emergency = red for urgent situations).

export const CATEGORIES = [
  {
    id: 'problem',
    labelKey: 'category.problem.label',
    taglineKey: 'category.problem.tagline',
    icon: 'pothole',
    theme: 'accent',
    types: [
      { id: 'pothole', labelKey: 'type.problem.pothole' },
      { id: 'waterlogging', labelKey: 'type.problem.waterlogging' },
      { id: 'open_manhole', labelKey: 'type.problem.open_manhole' },
      { id: 'broken_drainage', labelKey: 'type.problem.broken_drainage' },
      { id: 'debris_on_road', labelKey: 'type.problem.debris_on_road' },
      { id: 'broken_speed_breaker', labelKey: 'type.problem.broken_speed_breaker' },
      { id: 'other', labelKey: 'type.common.other' },
    ],
  },
  {
    id: 'corruption',
    labelKey: 'category.corruption.label',
    taglineKey: 'category.corruption.tagline',
    icon: 'signpost',
    theme: 'brand',
    types: [
      { id: 'bad_road_quality', labelKey: 'type.corruption.bad_road_quality' },
      { id: 'no_footpath', labelKey: 'type.corruption.no_footpath' },
      { id: 'incomplete_road_work', labelKey: 'type.corruption.incomplete_road_work' },
      { id: 'missing_signs', labelKey: 'type.corruption.missing_signs' },
      { id: 'no_streetlight', labelKey: 'type.corruption.no_streetlight' },
      { id: 'encroachment', labelKey: 'type.corruption.encroachment' },
      { id: 'other', labelKey: 'type.common.other' },
    ],
  },
  {
    id: 'emergency',
    labelKey: 'category.emergency.label',
    taglineKey: 'category.emergency.tagline',
    icon: 'siren',
    theme: 'emergency',
    // Blinkit/Zepto-style promise: a response team is dispatched the
    // moment an emergency report is submitted, ETA shown live from then.
    // See lib/time.js's getEtaProgress() and components/EmergencyTracker.
    etaMinutes: 10,
    types: [
      { id: 'accident', labelKey: 'type.emergency.accident' },
      { id: 'road_clash', labelKey: 'type.emergency.road_clash' },
      { id: 'vehicle_breakdown', labelKey: 'type.emergency.vehicle_breakdown' },
      { id: 'fire_hazard', labelKey: 'type.emergency.fire_hazard' },
      { id: 'medical_emergency', labelKey: 'type.emergency.medical_emergency' },
      { id: 'other', labelKey: 'type.common.other' },
    ],
  },
]

export function getCategory(id) {
  return CATEGORIES.find((c) => c.id === id)
}

export function getType(categoryId, typeId) {
  const category = getCategory(categoryId)
  return category?.types.find((t) => t.id === typeId)
}

export const STATUSES = [
  { id: 'submitted', labelKey: 'status.submitted', theme: 'ink' },
  { id: 'in_review', labelKey: 'status.in_review', theme: 'warning' },
  { id: 'in_progress', labelKey: 'status.in_progress', theme: 'brand' },
  { id: 'resolved', labelKey: 'status.resolved', theme: 'success' },
]

export function getStatus(id) {
  return STATUSES.find((s) => s.id === id) ?? STATUSES[0]
}

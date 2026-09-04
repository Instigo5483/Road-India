import { useId } from 'react'

// Self-contained category badge icons -- each SVG already includes its own
// rounded-square background and color, unlike the rest of Icons.jsx's
// single-color line icons that get tinted by a wrapping span. Render these
// directly at the size you want; no color/background wrapper needed.
//
// Gradient ids are namespaced with useId() because the same category icon
// renders many times on one page (every row in a report feed, for
// instance) -- SVG <linearGradient id> lookups aren't scoped per <svg>, so
// two instances sharing a literal id like "probBg" would silently make the
// browser reuse the first one's gradient for every later instance.

function RoadProblemIcon({ className }) {
  const gradId = `road-problem-bg-${useId()}`
  return (
    <svg
      viewBox="0 0 72 72"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFBEB" />
          <stop offset="100%" stopColor="#FEEBC8" />
        </linearGradient>
      </defs>

      <rect width="72" height="72" rx="20" fill={`url(#${gradId})`} />

      <ellipse cx="44" cy="46" rx="14" ry="7" fill="#CBD5E1" />
      <ellipse cx="44" cy="46" rx="11" ry="5" fill="#1E293B" />

      <ellipse cx="26" cy="50" rx="9" ry="3" fill="#D97706" />
      <polygon points="26,18 20,49 32,49" fill="#F97316" />
      <polygon points="23,32 29,32 30,37 22,37" fill="#FFFFFF" />
      <polygon points="24.5,23 27.5,23 28.5,28 23.5,28" fill="#FFFFFF" />
      <circle cx="26" cy="18" r="1.5" fill="#FFFFFF" />
    </svg>
  )
}

function RoadCorruptionIcon({ className }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
    >
      <rect width="64" height="64" rx="16" fill="#EEF2FF" />

      <rect
        x="18"
        y="16"
        width="28"
        height="36"
        rx="4"
        fill="#E0E7FF"
        stroke="#3730A3"
        strokeWidth="2"
      />
      <rect x="25" y="12" width="14" height="6" rx="2" fill="#4F46E5" />
      <line
        x1="24"
        y1="26"
        x2="32"
        y2="26"
        stroke="#818CF8"
        strokeWidth="2"
        strokeLinecap="round"
      />

      <path
        d="M22 36C26 31 38 31 42 36C38 41 26 41 22 36Z"
        fill="#FFFFFF"
        stroke="#3730A3"
        strokeWidth="1.8"
      />
      <circle cx="32" cy="36" r="3" fill="#4F46E5" />
      <circle cx="33" cy="35" r="1" fill="#FFFFFF" />

      <circle cx="44" cy="44" r="8" fill="#4338CA" />
      <path
        d="M41 47L47 41"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M47 47L41 41"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function RoadEmergencyIcon({ className }) {
  const gradId = `road-emergency-bg-${useId()}`
  return (
    <svg
      viewBox="0 0 72 72"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF1F2" />
          <stop offset="100%" stopColor="#FFE4E6" />
        </linearGradient>
      </defs>

      <rect width="72" height="72" rx="20" fill={`url(#${gradId})`} />

      <path
        d="M19 23C13 29 13 41 19 47"
        fill="none"
        stroke="#E11D48"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M53 23C59 29 59 41 53 47"
        fill="none"
        stroke="#E11D48"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M24 28C21 32 21 38 24 42"
        fill="none"
        stroke="#E11D48"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M48 28C51 32 51 38 48 42"
        fill="none"
        stroke="#E11D48"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      <circle cx="36" cy="35" r="10" fill="#E11D48" />
      <path
        d="M36 29V41M30 35H42"
        stroke="#FFFFFF"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

const CATEGORY_ICON_COMPONENTS = {
  issue: RoadProblemIcon,
  problem: RoadProblemIcon,
  corruption: RoadCorruptionIcon,
  emergency: RoadEmergencyIcon,
}

/** New reports use `issue`; legacy records retain their original ids. */
export default function CategoryIcon({ category, className = 'h-11 w-11' }) {
  const Icon = CATEGORY_ICON_COMPONENTS[category]
  return Icon ? <Icon className={className} /> : null
}

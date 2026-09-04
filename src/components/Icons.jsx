// Small hand-rolled line-icon set (no icon library dependency). Every icon
// takes the same { className, strokeWidth } props and renders a 24x24
// stroke-based SVG so they drop into buttons/cards/badges consistently.

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

function Svg({ children, className, strokeWidth = 1.8, ...props }) {
  return (
    <svg className={className} strokeWidth={strokeWidth} {...base} {...props}>
      {children}
    </svg>
  )
}

export function IconSiren(props) {
  return (
    <Svg {...props}>
      <path d="M9 18v-6a3 3 0 0 1 6 0v6" />
      <path d="M6 18h12v2a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-2Z" />
      <path d="M12 2v2" />
      <path d="M5 8l1.5 1" />
      <path d="M19 8l-1.5 1" />
      <path d="M4 12h2" />
      <path d="M18 12h2" />
    </Svg>
  )
}

export function IconCamera(props) {
  return (
    <Svg {...props}>
      <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="13" r="3.5" />
    </Svg>
  )
}

export function IconMapPin(props) {
  return (
    <Svg {...props}>
      <path d="M12 21s7-6.5 7-11.5a7 7 0 1 0-14 0C5 14.5 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.3" />
    </Svg>
  )
}

export function IconThumbsUp(props) {
  return (
    <Svg {...props}>
      <path d="M7 11v9H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3Z" />
      <path d="M7 11l4.5-8a2 2 0 0 1 2 2l-1 4h5.2a2 2 0 0 1 1.94 2.5l-1.6 6A2 2 0 0 1 16.1 19H10a3 3 0 0 1-3-3" />
    </Svg>
  )
}

export function IconGlobe(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a15 15 0 0 1 0 18" />
      <path d="M12 3a15 15 0 0 0 0 18" />
    </Svg>
  )
}

export function IconShieldCheck(props) {
  return (
    <Svg {...props}>
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" />
      <path d="M9 12l2 2 4-4.5" />
    </Svg>
  )
}

export function IconClock(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </Svg>
  )
}

export function IconChevronLeft(props) {
  return (
    <Svg {...props}>
      <path d="M15 6l-6 6 6 6" />
    </Svg>
  )
}

export function IconMenu(props) {
  return (
    <Svg {...props}>
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </Svg>
  )
}

export function IconChevronRight(props) {
  return (
    <Svg {...props}>
      <path d="M9 6l6 6-6 6" />
    </Svg>
  )
}

export function IconChevronDown(props) {
  return (
    <Svg {...props}>
      <path d="M6 9l6 6 6-6" />
    </Svg>
  )
}

export function IconCheck(props) {
  return (
    <Svg {...props}>
      <path d="M5 12.5l4.5 4.5L19 7" />
    </Svg>
  )
}

export function IconCheckCircle(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.5 2.5L16 9" />
    </Svg>
  )
}

export function IconX(props) {
  return (
    <Svg {...props}>
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </Svg>
  )
}

export function IconSearch(props) {
  return (
    <Svg {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </Svg>
  )
}

export function IconFilter(props) {
  return (
    <Svg {...props}>
      <path d="M4 5h16" />
      <path d="M7 12h10" />
      <path d="M10 19h4" />
    </Svg>
  )
}

export function IconUser(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.9 3.1-6.5 7-6.5s7 2.6 7 6.5" />
    </Svg>
  )
}

export function IconLogOut(props) {
  return (
    <Svg {...props}>
      <path d="M15 3h3a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-3" />
      <path d="M10 8l-4 4 4 4" />
      <path d="M6 12h12" />
    </Svg>
  )
}

export function IconArrowRight(props) {
  return (
    <Svg {...props}>
      <path d="M4 12h16" />
      <path d="M13 5l7 7-7 7" />
    </Svg>
  )
}

export function IconLocate(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="2.5" />
      <path d="M12 2v3" />
      <path d="M12 19v3" />
      <path d="M2 12h3" />
      <path d="M19 12h3" />
      <circle cx="12" cy="12" r="7.5" />
    </Svg>
  )
}

export function IconAlertCircle(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5" />
      <path d="M12 16.2v.1" />
    </Svg>
  )
}

export function IconLoader(props) {
  return (
    <Svg {...props} className={`animate-spin ${props.className ?? ''}`}>
      <path d="M12 3v3" />
      <path d="M12 18v3" />
      <path d="M4.2 4.2l2.1 2.1" />
      <path d="M17.7 17.7l2.1 2.1" />
      <path d="M3 12h3" />
      <path d="M18 12h3" />
      <path d="M4.2 19.8l2.1-2.1" />
      <path d="M17.7 6.3l2.1-2.1" />
    </Svg>
  )
}

export function IconSettings(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.5v3" />
      <path d="M12 18.5v3" />
      <path d="M21.5 12h-3" />
      <path d="M5.5 12h-3" />
      <path d="M18.5 5.5l-2.1 2.1" />
      <path d="M7.6 16.4l-2.1 2.1" />
      <path d="M18.5 18.5l-2.1-2.1" />
      <path d="M7.6 7.6l-2.1-2.1" />
    </Svg>
  )
}

export function IconFingerprint(props) {
  return (
    <Svg {...props}>
      <path d="M12 3a7 7 0 0 1 7 7v2.5" />
      <path d="M5 12.5V10a7 7 0 0 1 3-5.7" />
      <path d="M8.5 21a12 12 0 0 1-1.8-4.6" />
      <path d="M12 6.5a5.5 5.5 0 0 1 5.5 5.5v1.5" />
      <path d="M12 6.5A5.5 5.5 0 0 0 6.5 12v1a15 15 0 0 0 2 7.5" />
      <path d="M12 10a2.5 2.5 0 0 1 2.5 2.5c0 3-1 6.5-2.7 9" />
      <path d="M9.5 12.5a2.5 2.5 0 0 1 2.5-2.5" />
    </Svg>
  )
}

export function IconLockCloud(props) {
  return (
    <Svg {...props}>
      <path d="M7 11V8a5 5 0 0 1 10 0v3" />
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <circle cx="12" cy="15.5" r="1.4" />
      <path d="M12 16.9v1.6" />
    </Svg>
  )
}

export function IconListChecks(props) {
  return (
    <Svg {...props}>
      <path d="M4 6.5l1.5 1.5L8 5.5" />
      <path d="M11 6.5h9" />
      <path d="M4 12.5l1.5 1.5L8 11.5" />
      <path d="M11 12.5h9" />
      <path d="M4 18.5l1.5 1.5L8 17.5" />
      <path d="M11 18.5h9" />
    </Svg>
  )
}

export function IconStar({ className, ...props }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} {...props}>
      <path d="M12 2.5l2.9 6.1 6.6.7-4.9 4.6 1.3 6.6L12 17.6l-5.9 3.1 1.3-6.6L2.5 9.3l6.6-.7L12 2.5Z" />
    </svg>
  )
}

export function IconEdit(props) {
  return (
    <Svg {...props}>
      <path d="M4 20l1-4.5L15.5 5 19 8.5 8.5 19 4 20Z" />
      <path d="M13 7l4 4" />
    </Svg>
  )
}

export function IconAward(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="8.5" r="5.5" />
      <path d="M8.5 13.3L7 21l5-3 5 3-1.5-7.7" />
    </Svg>
  )
}

export function IconSparkle(props) {
  return (
    <Svg {...props}>
      <path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3Z" />
      <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" />
    </Svg>
  )
}

export function IconHome(props) {
  return (
    <Svg {...props}>
      <path d="m3 10 9-7 9 7" />
      <path d="M5 9v11h14V9" />
      <path d="M9 20v-6h6v6" />
    </Svg>
  )
}

export function IconChartBar(props) {
  return (
    <Svg {...props}>
      <path d="M4 20V10h4v10" />
      <path d="M10 20V4h4v16" />
      <path d="M16 20v-7h4v7" />
      <path d="M2 20h20" />
    </Svg>
  )
}

export function IconFolder(props) {
  return (
    <Svg {...props}>
      <path d="M3 6h6l2 2h10v11H3z" />
    </Svg>
  )
}

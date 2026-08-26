// The Road India logo mark -- a map pin split into saffron (top) and green
// (bottom) halves with a highway-perspective road inside and a small
// "AI pulse" dot at the top. Extracted from the brand SVG's icon group
// (the wordmark text is left out here since the adjacent i18n label,
// t('common.appName'), already carries "Road India" in whichever language
// is active -- baking in the English wordmark graphic would break Hindi).
export default function Logo({ className = 'h-8 w-8' }) {
  return (
    <svg viewBox="0 0 120 120" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="road-india-saffron" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF9933" />
          <stop offset="100%" stopColor="#E65100" />
        </linearGradient>
        <linearGradient id="road-india-green" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#138808" />
          <stop offset="100%" stopColor="#0E5A05" />
        </linearGradient>
      </defs>
      <g transform="translate(10, 10)">
        <path
          d="M50 0 C22.4 0 0 22.4 0 50 C0 80 50 100 50 100"
          fill="none"
          stroke="url(#road-india-saffron)"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M50 100 C50 100 100 80 100 50 C100 22.4 77.6 0 50 0"
          fill="none"
          stroke="url(#road-india-green)"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <polygon points="32,75 42,32 58,32 68,75" fill="#1E293B" />
        <line
          x1="50"
          y1="36"
          x2="50"
          y2="70"
          stroke="#F8FAFC"
          strokeWidth="3"
          strokeDasharray="6,4"
          strokeLinecap="round"
        />
        <circle cx="50" cy="22" r="5" fill="#2563EB" />
      </g>
    </svg>
  )
}

import { useState } from 'react'
import { IconStar } from './Icons'

/** Interactive 1-5 star picker -- used by ReportFeedbackForm. */
export function StarRatingInput({ value, onChange }) {
  const [hover, setHover] = useState(0)

  return (
    <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          className={`transition-colors ${(hover || value) >= n ? 'text-amber-400' : 'text-ink-200'}`}
        >
          <IconStar className="h-6 w-6" />
        </button>
      ))}
    </div>
  )
}

/** Read-only star display for an already-submitted rating. */
export function StarRatingDisplay({ rating, className = 'h-3.5 w-3.5' }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <IconStar key={n} className={`${className} ${n <= rating ? 'text-amber-400' : 'text-ink-200'}`} />
      ))}
    </span>
  )
}

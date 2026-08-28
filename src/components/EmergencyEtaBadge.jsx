import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { getEtaProgress, formatCountdown } from '../lib/time'
import { IconSiren } from './Icons'

/**
 * Compact live "Arriving in X:XX" pill for emergency reports, used on
 * report cards (community feed + dashboard). Renders nothing once the
 * promised ETA window has passed, so the card falls back to the normal
 * status badge -- see lib/time.js's getEtaProgress for how the countdown
 * is computed (a client-side simulation, not a real dispatch feed). Also
 * hides as soon as the report is marked resolved, even if the simulated
 * countdown hasn't run out yet -- a response team can genuinely finish
 * faster than the promised ETA, and the badge shouldn't keep counting
 * down on an issue that's already been dealt with.
 */
export default function EmergencyEtaBadge({ createdAt, etaMinutes, status }) {
  const { t } = useLanguage()
  const [, forceTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [])

  if (status === 'resolved') return null

  const { remainingMs, arrived } = getEtaProgress(createdAt, etaMinutes)
  if (arrived) return null

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="inline-flex items-center gap-1.5 rounded-full bg-emergency-600 px-2.5 py-1 text-xs font-bold text-white"
    >
      <motion.span
        animate={{ opacity: [1, 0.4, 1] }}
        transition={{ duration: 1.2, repeat: Infinity }}
      >
        <IconSiren className="h-3 w-3" />
      </motion.span>
      {t('emergency.badge.arriving', { time: formatCountdown(remainingMs) })}
    </motion.span>
  )
}

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { getEtaProgress, formatCountdown } from '../lib/time'
import { IconSiren, IconCheck } from './Icons'

const STAGE_THRESHOLDS = [
  { max: 0.15, key: 'emergency.tracker.stage.received' },
  { max: 0.85, key: 'emergency.tracker.stage.dispatched' },
  { max: 1, key: 'emergency.tracker.stage.arriving' },
]

function getStageKey(fraction) {
  const stage = STAGE_THRESHOLDS.find((s) => fraction < s.max)
  return stage?.key ?? 'emergency.tracker.stage.arriving'
}

/**
 * A Blinkit/Zepto-style live ETA screen shown right after an emergency
 * report is submitted: a pulsing siren, a ticking countdown, and a
 * progress bar that fills as the promised response window elapses.
 *
 * There's no real dispatch system behind this in the hackathon build --
 * it's a pure client-side simulation computed from `createdAt` and the
 * category's `etaMinutes` (see lib/time.js's getEtaProgress). Swap this
 * for a real dispatch/tracking integration before using this for an
 * actual emergency-response product.
 *
 * `status` is the report's *live* status (passed in from the reports
 * list, not the one-time snapshot captured right after submitting) --
 * if a response team marks it resolved before the simulated countdown
 * would have finished on its own, this stops ticking and shows a
 * resolved state immediately rather than continuing to count down on an
 * issue that's already been dealt with.
 */
export default function EmergencyTracker({ createdAt, etaMinutes, status }) {
  const { t } = useLanguage()
  const [, forceTick] = useState(0)
  const resolved = status === 'resolved'

  useEffect(() => {
    if (resolved) return
    const id = setInterval(() => forceTick((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [resolved])

  const { remainingMs, fraction, arrived } = getEtaProgress(
    createdAt,
    etaMinutes
  )
  const done = resolved || arrived

  return (
    <div className="w-full rounded-2xl border border-emergency-100 bg-emergency-50/60 p-6 text-center">
      <div className="relative mx-auto grid h-20 w-20 place-items-center">
        {!done && (
          <motion.span
            className="absolute inset-0 rounded-full bg-emergency-400/40"
            animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
          />
        )}
        <span className="relative grid h-16 w-16 place-items-center rounded-full bg-emergency-600 text-white shadow-card">
          <IconSiren className="h-7 w-7" />
        </span>
      </div>

      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-emergency-600">
        {resolved
          ? t('emergency.tracker.resolvedLabel')
          : arrived
            ? t('emergency.tracker.arrivedLabel')
            : t('emergency.tracker.arrivingLabel')}
      </p>

      <motion.p
        key={resolved ? 'resolved' : arrived ? 'arrived' : formatCountdown(remainingMs)}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-1 font-mono text-4xl font-extrabold tabular-nums text-emergency-800 sm:text-5xl"
      >
        {done ? (
          <IconCheck className="mx-auto h-10 w-10" />
        ) : (
          formatCountdown(remainingMs)
        )}
      </motion.p>

      <p className="mx-auto mt-3 max-w-xs text-sm font-medium text-emergency-700">
        {resolved ? t('emergency.tracker.stage.resolved') : t(getStageKey(fraction))}
      </p>

      <div className="mx-auto mt-5 h-2 w-full max-w-sm overflow-hidden rounded-full bg-emergency-100">
        <motion.div
          className="h-full rounded-full bg-emergency-600"
          initial={{ width: 0 }}
          animate={{ width: `${done ? 100 : Math.min(fraction * 100, 100)}%` }}
          transition={{ ease: 'linear', duration: 0.6 }}
        />
      </div>

      <p className="mt-4 text-xs text-emergency-600/80">
        {t('emergency.tracker.disclaimer')}
      </p>
    </div>
  )
}

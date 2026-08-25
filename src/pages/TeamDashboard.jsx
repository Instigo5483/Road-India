import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useTeamAuth } from '../context/TeamAuthContext'
import { useReports } from '../context/ReportsContext'
import { useLanguage } from '../context/LanguageContext'
import { useTeamPwaMeta } from '../lib/teamPwa'
import { requestFcmToken } from '../lib/messaging'
import { getCategory, getType } from '../data/categoryTypes'
import { getTeamType, getTeamStatus } from '../data/teamTypes'
import { distanceKm } from '../lib/geo'
import Button from '../components/Button'
import AiTriageCard from '../components/AiTriageCard'
import EmptyState from '../components/EmptyState'
import {
  IconLogOut,
  IconMapPin,
  IconLocate,
  IconCheckCircle,
  IconAlertCircle,
} from '../components/Icons'

const LOCATION_WRITE_INTERVAL_MS = 20000

export default function TeamDashboard() {
  const { team, logoutTeam, updateTeam } = useTeamAuth()
  const { reports, updateReportStatus } = useReports()
  const { t } = useLanguage()
  const navigate = useNavigate()

  useTeamPwaMeta()

  const [locationError, setLocationError] = useState(false)
  const [completing, setCompleting] = useState(false)
  const lastWriteRef = useRef(0)

  // Requests a push-notification token once on mount (no-op if unsupported
  // -- see lib/messaging.js) and keeps the team's location fresh in
  // Firestore while this tab is open, throttled to avoid write spam. Real
  // background tracking while the app is closed needs a native app; see
  // the PWA background-location caveat this feature was scoped around.
  useEffect(() => {
    requestFcmToken().then((fcmToken) => {
      if (fcmToken) updateTeam({ fcmToken })
    })

    if (!navigator.geolocation) {
      setLocationError(true)
      return
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setLocationError(false)
        const now = Date.now()
        if (now - lastWriteRef.current < LOCATION_WRITE_INTERVAL_MS) return
        lastWriteRef.current = now
        updateTeam({ location: { lat: pos.coords.latitude, lng: pos.coords.longitude } })
      },
      () => setLocationError(true),
      { enableHighAccuracy: true, maximumAge: 15000 }
    )

    return () => navigator.geolocation.clearWatch(watchId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const currentReport = useMemo(
    () => (team?.currentReportId ? reports.find((r) => r.id === team.currentReportId) : null),
    [reports, team?.currentReportId]
  )

  const teamType = getTeamType(team?.type)
  const teamStatus = getTeamStatus(team?.status)

  const distance =
    currentReport?.location && team?.location ? distanceKm(team.location, currentReport.location) : null

  async function handleToggleAvailability() {
    await updateTeam({ status: team.status === 'offline' ? 'available' : 'offline' })
  }

  async function handleComplete() {
    if (!currentReport) return
    setCompleting(true)
    try {
      await updateReportStatus(currentReport.id, 'resolved')
      await updateTeam({ status: 'available', currentReportId: null })
    } finally {
      setCompleting(false)
    }
  }

  async function handleLogout() {
    await logoutTeam()
    navigate('/team/login', { replace: true })
  }

  const category = currentReport ? getCategory(currentReport.category) : null
  const type = currentReport ? getType(currentReport.category, currentReport.type) : null

  const mapsUrl = currentReport?.location
    ? `https://www.google.com/maps/dir/?api=1&destination=${currentReport.location.lat},${currentReport.location.lng}`
    : null

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="sticky top-0 z-20 border-b border-ink-200 bg-white/95 shadow-card backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-brand-900">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-emergency-600 text-sm text-white">
              RI
            </span>
            {team ? team.name : t('team.dashboard.title')}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 px-3.5 py-2 text-sm font-medium text-ink-600 transition-colors hover:border-emergency-300 hover:text-emergency-600"
          >
            <IconLogOut className="h-4 w-4" />
            {t('team.dashboard.logout')}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-6 sm:px-6 sm:py-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between rounded-2xl border border-ink-200 bg-white p-4"
        >
          <div>
            <p className="text-xs font-medium text-ink-400">
              {teamType ? t(teamType.labelKey) : team?.type} · {t('team.dashboard.statusLabel')}
            </p>
            <p className={`mt-0.5 text-sm font-bold ${STATUS_TEXT[teamStatus.theme]}`}>
              {t(teamStatus.labelKey)}
            </p>
          </div>
          {team?.status !== 'busy' && (
            <Button size="sm" variant={team?.status === 'offline' ? 'primary' : 'secondary'} onClick={handleToggleAvailability}>
              {team?.status === 'offline' ? t('team.dashboard.goAvailable') : t('team.dashboard.goOffline')}
            </Button>
          )}
        </motion.div>

        {locationError && (
          <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-warning-600">
            <IconAlertCircle className="h-3.5 w-3.5" />
            {t('team.dashboard.locationDenied')}
          </p>
        )}

        <div className="mt-6">
          {!currentReport ? (
            <EmptyState
              icon={<IconLocate className="h-6 w-6" />}
              title={t('team.dashboard.noJob.title')}
              subtitle={t('team.dashboard.noJob.subtitle')}
            />
          ) : (
            <motion.div
              key={currentReport.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 rounded-2xl border border-emergency-200 bg-white p-5 shadow-card"
            >
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-emergency-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emergency-600">
                  {t('team.dashboard.currentJob')}
                </span>
                {distance != null && isFinite(distance) && (
                  <span className="text-xs font-semibold text-ink-500">
                    {t('team.dashboard.distanceAway', { distance: distance.toFixed(1) })}
                  </span>
                )}
              </div>

              <div>
                <h2 className="text-lg font-bold text-ink-900">
                  {type ? t(type.labelKey) : currentReport.type}
                </h2>
                {category && <p className="text-xs text-ink-400">{t(category.labelKey)}</p>}
              </div>

              <p className="text-sm leading-relaxed text-ink-700">{currentReport.description}</p>

              <p className="flex items-start gap-1.5 text-sm text-ink-500">
                <IconMapPin className="mt-0.5 h-4 w-4 shrink-0 text-emergency-600" />
                {currentReport.location?.address ?? t('report.step2.coordinates')}
              </p>

              <AiTriageCard triage={currentReport.aiTriage} />

              <div className="flex flex-col gap-3 sm:flex-row">
                {mapsUrl && (
                  <Button
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="secondary"
                    className="w-full"
                  >
                    {t('team.dashboard.navigate')}
                  </Button>
                )}
                <Button className="w-full" onClick={handleComplete} loading={completing} icon={<IconCheckCircle className="h-4 w-4" />}>
                  {completing ? t('team.dashboard.completing') : t('team.dashboard.complete')}
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  )
}

const STATUS_TEXT = {
  success: 'text-success-600',
  warning: 'text-warning-600',
  ink: 'text-ink-500',
}

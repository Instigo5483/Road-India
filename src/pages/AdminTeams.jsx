import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, onSnapshot } from 'firebase/firestore'
import { useAdminAuth } from '../context/AdminAuthContext'
import { useLanguage } from '../context/LanguageContext'
import { getTeamType, getTeamStatus } from '../data/teamTypes'
import { db, isFirebaseConfigured } from '../lib/firebase'
import Button from '../components/Button'
import { IconChevronLeft, IconLogOut } from '../components/Icons'

const TEAM_STATUS_BADGE = {
  success: 'bg-success-50 text-success-700',
  warning: 'bg-warning-50 text-warning-600',
  ink: 'bg-ink-100 text-ink-500',
}

/** Standalone Response Teams roster page -- previously an inline section
 * at the bottom of Admin.jsx; broken out so the report-management
 * dashboard stays focused and the team roster has room to grow (roster
 * list + provisioning entry point) without crowding the reports list. */
export default function AdminTeams() {
  const { logoutAdmin } = useAdminAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()

  const [teams, setTeams] = useState([])

  useEffect(() => {
    if (!isFirebaseConfigured) return
    const unsub = onSnapshot(collection(db, 'teams'), (snap) => {
      setTeams(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [])

  function handleLogout() {
    logoutAdmin()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="sticky top-0 z-20 border-b border-ink-200 bg-white/95 shadow-card backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="inline-flex items-center gap-1 text-sm font-medium text-ink-500 hover:text-brand-700"
          >
            <IconChevronLeft className="h-4 w-4" />
            {t('admin.teams.backToDashboard')}
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 px-3.5 py-2 text-sm font-medium text-ink-600 transition-colors hover:border-emergency-300 hover:text-emergency-600"
          >
            <IconLogOut className="h-4 w-4" />
            {t('admin.logout')}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <h1 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl">
          {t('admin.teams.heading')}
        </h1>
        <p className="mt-1.5 text-ink-500">{t('admin.teams.subtitle')}</p>

        {!isFirebaseConfigured ? (
          <p className="mt-8 rounded-2xl border border-ink-200 bg-white p-6 text-sm text-ink-500">
            {t('admin.teams.unavailable')}
          </p>
        ) : (
          <>
            <div className="mt-6 space-y-2">
              {teams.length === 0 && (
                <p className="text-sm text-ink-400">
                  {t('admin.teams.rosterEmpty')}
                </p>
              )}
              {teams.map((team) => {
                const type = getTeamType(team.type)
                const status = getTeamStatus(team.status)
                return (
                  <div
                    key={team.id}
                    className="flex items-center justify-between rounded-xl border border-ink-200 bg-white px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink-900">
                        {team.name}
                      </p>
                      <p className="text-xs text-ink-400">
                        {type ? t(type.labelKey) : team.type} · {team.id}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${TEAM_STATUS_BADGE[status.theme]}`}
                    >
                      {t(status.labelKey)}
                    </span>
                  </div>
                )
              })}
            </div>

            <div className="mt-6">
              <Button
                variant="secondary"
                onClick={() => navigate('/admin/teams/new')}
              >
                {t('admin.teams.addNew')}
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

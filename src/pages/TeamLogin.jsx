import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTeamAuth } from '../context/TeamAuthContext'
import { useLanguage } from '../context/LanguageContext'
import Button from '../components/Button'
import { getTeamType } from '../data/teamTypes'
import {
  IconChevronLeft,
  IconAlertCircle,
  IconSiren,
  IconShieldCheck,
} from '../components/Icons'

// Must stay in sync with scripts/seedTeams.js -- shown here so evaluators
// can sign into the response-team dashboard without credentials being
// emailed around separately. See auth.role.* / team.testCredentials.* i18n
// keys for the surrounding "for testing only" framing.
const TEST_TEAMS = [
  { id: 'amb-001', passcode: 'amb-001-pass', type: 'ambulance' },
  { id: 'doc-001', passcode: 'doc-001-pass', type: 'doctor' },
  { id: 'police-001', passcode: 'police-001-pass', type: 'police' },
  { id: 'amb-002', passcode: 'amb-002-pass', type: 'ambulance' },
  { id: 'tow-001', passcode: 'tow-001-pass', type: 'tow' },
  { id: 'fire-001', passcode: 'fire-001-pass', type: 'fire' },
]

export default function TeamLogin() {
  const { loginTeam, unavailable } = useTeamAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname ?? '/team'

  const [teamId, setTeamId] = useState('')
  const [passcode, setPasscode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const ok = await loginTeam(teamId, passcode)
      if (ok) {
        navigate(from, { replace: true })
      } else {
        setError(t('team.login.error'))
      }
    } catch {
      setError(t('team.login.error'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4 py-10">
      <div className="w-full max-w-3xl">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-ink-500 hover:text-brand-700"
        >
          <IconChevronLeft className="h-4 w-4" />
          {t('team.back')}
        </button>

        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm overflow-hidden rounded-2xl border border-ink-200 bg-white p-6 shadow-card-hover sm:p-8"
          >
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-emergency-500/10 text-emergency-600">
              <IconSiren className="h-5.5 w-5.5" />
            </span>
            <h1 className="mt-4 text-lg font-bold text-ink-900">
              {t('team.login.title')}
            </h1>
            <p className="mt-1 text-sm text-ink-500">
              {t('team.login.subtitle')}
            </p>

            {unavailable ? (
              <p className="mt-5 flex items-start gap-2 rounded-xl bg-warning-50 px-3.5 py-3 text-sm text-warning-600">
                <IconAlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {t('team.login.unavailable')}
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-ink-700">
                    {t('team.login.idLabel')}
                  </span>
                  <input
                    value={teamId}
                    onChange={(e) => setTeamId(e.target.value)}
                    placeholder={t('team.login.idPlaceholder')}
                    className="input-field"
                    autoFocus
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-ink-700">
                    {t('team.login.passcodeLabel')}
                  </span>
                  <input
                    type="password"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    className="input-field"
                  />
                </label>

                {error && (
                  <p className="flex items-center gap-1.5 text-xs font-medium text-emergency-600">
                    <IconAlertCircle className="h-3.5 w-3.5" />
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  loading={busy}
                  disabled={!teamId || !passcode}
                >
                  {t('team.login.submit')}
                </Button>
              </form>
            )}
          </motion.div>

          {!unavailable && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="w-full rounded-2xl border border-warning-200 bg-warning-50 p-5"
            >
              <p className="flex items-center gap-1.5 text-sm font-bold text-warning-700">
                <IconShieldCheck className="h-4 w-4" />
                {t('team.testCredentials.heading')}
              </p>
              <p className="mt-1 text-xs text-warning-600">
                {t('team.testCredentials.note')}
              </p>

              <div className="mt-3.5 space-y-2">
                {TEST_TEAMS.map((team) => {
                  const type = getTeamType(team.type)
                  return (
                    <div
                      key={team.id}
                      className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-lg bg-white px-3 py-2 text-xs"
                    >
                      <span className="font-medium text-ink-500">
                        {type ? t(type.labelKey) : team.type}
                      </span>
                      <span className="font-mono text-ink-900">
                        {team.id} / {team.passcode}
                      </span>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

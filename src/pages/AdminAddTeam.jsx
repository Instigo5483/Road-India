import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { useAdminAuth } from '../context/AdminAuthContext'
import { isFirebaseConfigured } from '../lib/firebase'
import { createTeam } from '../lib/teams'
import { TEAM_TYPES } from '../data/teamTypes'
import { CITIES } from '../data/cities'
import Button from '../components/Button'
import {
  IconChevronLeft,
  IconCheck,
  IconAlertCircle,
  IconLogOut,
} from '../components/Icons'

const ID_PATTERN = /^[a-z0-9-]{3,32}$/

/** Standalone page (not a dashboard-inline form) for provisioning a new
 * response team -- lets the admin pick the team's own ID and passcode
 * rather than having one auto-generated, and its base is a city-level
 * area rather than an exact map pin (see data/cities.js). */
export default function AdminAddTeam() {
  const { t } = useLanguage()
  const { logoutAdmin } = useAdminAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [type, setType] = useState(TEAM_TYPES[0].id)
  const [id, setId] = useState('')
  const [passcode, setPasscode] = useState('')
  const [cityId, setCityId] = useState(CITIES[0].id)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState(null)

  function handleLogout() {
    logoutAdmin()
    navigate('/admin/login', { replace: true })
  }

  function resetForm() {
    setCreated(null)
    setName('')
    setId('')
    setPasscode('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!name.trim()) return
    if (!ID_PATTERN.test(id)) {
      setError(t('admin.teams.error.idFormat'))
      return
    }
    if (passcode.trim().length < 6) {
      setError(t('admin.teams.error.passcodeLength'))
      return
    }

    setBusy(true)
    try {
      const result = await createTeam({
        id: id.trim(),
        passcode: passcode.trim(),
        name: name.trim(),
        type,
        cityId,
      })
      setCreated(result)
    } catch (err) {
      setError(
        err?.message === 'ID_TAKEN'
          ? t('admin.teams.error.idTaken')
          : t('admin.teams.error')
      )
    } finally {
      setBusy(false)
    }
  }

  if (!isFirebaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-ink-200 bg-white p-8 text-center shadow-card-hover">
          <p className="text-sm text-ink-500">{t('admin.teams.unavailable')}</p>
          <Button
            className="mt-5"
            variant="secondary"
            onClick={() => navigate('/admin')}
          >
            {t('admin.teams.backToDashboard')}
          </Button>
        </div>
      </div>
    )
  }

  if (created) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-2xl border border-success-200 bg-success-50 p-8 text-center"
        >
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-success-100 text-success-700">
            <IconCheck className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-lg font-bold text-ink-900">
            {t('admin.teams.created.title')}
          </h1>
          <p className="mt-2 text-sm text-ink-600">
            {t('admin.teams.created.customNote')}
          </p>

          <div className="mt-4 rounded-xl bg-white px-4 py-3 text-left">
            <p className="text-[11px] font-medium uppercase tracking-wide text-ink-400">
              {t('admin.teams.created.idLabel')}
            </p>
            <p className="font-mono text-sm font-semibold text-ink-900">
              {created.id}
            </p>
          </div>

          <div className="mt-5 flex gap-3">
            <Button variant="secondary" className="w-full" onClick={resetForm}>
              {t('admin.teams.addAnother')}
            </Button>
            <Button className="w-full" onClick={() => navigate('/admin')}>
              {t('admin.teams.backToDashboard')}
            </Button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="sticky top-0 z-20 border-b border-ink-200 bg-white/95 shadow-card backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
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

      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
        <h1 className="font-display text-2xl font-bold text-ink-900">
          {t('admin.teams.addNew')}
        </h1>
        <p className="mt-1.5 text-ink-500">{t('admin.teams.addNewSubtitle')}</p>

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-4 rounded-2xl border border-ink-200 bg-white p-6 shadow-card sm:p-8"
        >
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-700">
              {t('admin.teams.nameLabel')}
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('admin.teams.namePlaceholder')}
              className="input-field"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-700">
              {t('admin.teams.typeLabel')}
            </span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="input-field"
            >
              {TEAM_TYPES.map((tt) => (
                <option key={tt.id} value={tt.id}>
                  {t(tt.labelKey)}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-700">
              {t('admin.teams.areaLabel')}
            </span>
            <select
              value={cityId}
              onChange={(e) => setCityId(e.target.value)}
              className="input-field"
            >
              {CITIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-ink-400">
              {t('admin.teams.areaHint')}
            </p>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink-700">
                {t('admin.teams.idLabel')}
              </span>
              <input
                value={id}
                onChange={(e) =>
                  setId(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                }
                placeholder={t('admin.teams.idPlaceholder')}
                className="input-field font-mono"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink-700">
                {t('admin.teams.passcodeLabel')}
              </span>
              <input
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder={t('admin.teams.passcodePlaceholder')}
                className="input-field font-mono"
              />
            </label>
          </div>
          <p className="text-xs text-ink-400">
            {t('admin.teams.idPasscodeHint')}
          </p>

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
            disabled={!name.trim() || !id.trim() || !passcode.trim()}
          >
            {busy ? t('admin.teams.creating') : t('admin.teams.create')}
          </Button>
        </form>
      </main>
    </div>
  )
}

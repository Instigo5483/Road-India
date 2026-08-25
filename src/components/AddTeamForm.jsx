import { useState } from 'react'
import { motion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { createTeam } from '../lib/teams'
import { TEAM_TYPES } from '../data/teamTypes'
import MapPicker from './MapPicker'
import Button from './Button'
import { IconCheck, IconAlertCircle } from './Icons'

/** Admin-only form to provision a new response team -- generates the team
 * ID and passcode (src/lib/teams.js) and shows them once right after
 * creation, since there's no roster "reveal passcode" view elsewhere. */
export default function AddTeamForm() {
  const { t } = useLanguage()
  const [name, setName] = useState('')
  const [type, setType] = useState(TEAM_TYPES[0].id)
  const [location, setLocation] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState(null)
  const [copiedField, setCopiedField] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim() || !location?.lat) return
    setBusy(true)
    setError('')
    try {
      const result = await createTeam({ name: name.trim(), type, location })
      setCreated(result)
      setName('')
      setLocation(null)
    } catch {
      setError(t('admin.teams.error'))
    } finally {
      setBusy(false)
    }
  }

  function handleCopy(field, value) {
    navigator.clipboard?.writeText(value)
    setCopiedField(field)
    setTimeout(() => setCopiedField(''), 1500)
  }

  if (created) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-success-200 bg-success-50 p-5"
      >
        <p className="flex items-center gap-2 text-sm font-bold text-success-700">
          <IconCheck className="h-4 w-4" />
          {t('admin.teams.created.title')}
        </p>

        <div className="mt-4 space-y-3">
          <CredentialRow
            label={t('admin.teams.created.idLabel')}
            value={created.id}
            copied={copiedField === 'id'}
            onCopy={() => handleCopy('id', created.id)}
            t={t}
          />
          <CredentialRow
            label={t('admin.teams.created.passcodeLabel')}
            value={created.passcode}
            copied={copiedField === 'passcode'}
            onCopy={() => handleCopy('passcode', created.passcode)}
            t={t}
          />
        </div>

        <p className="mt-4 text-xs text-success-700">{t('admin.teams.created.note')}</p>

        <Button size="sm" variant="secondary" className="mt-4" onClick={() => setCreated(null)}>
          {t('admin.teams.created.done')}
        </Button>
      </motion.div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-ink-200 bg-white p-5">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink-700">{t('admin.teams.nameLabel')}</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('admin.teams.namePlaceholder')}
          className="input-field"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink-700">{t('admin.teams.typeLabel')}</span>
        <select value={type} onChange={(e) => setType(e.target.value)} className="input-field">
          {TEAM_TYPES.map((tt) => (
            <option key={tt.id} value={tt.id}>
              {t(tt.labelKey)}
            </option>
          ))}
        </select>
      </label>

      <div>
        <span className="mb-1.5 block text-sm font-medium text-ink-700">{t('admin.teams.locationLabel')}</span>
        <MapPicker value={location} onChange={setLocation} />
      </div>

      {error && (
        <p className="flex items-center gap-1.5 text-xs font-medium text-emergency-600">
          <IconAlertCircle className="h-3.5 w-3.5" />
          {error}
        </p>
      )}

      <Button type="submit" loading={busy} disabled={!name.trim() || !location?.lat}>
        {busy ? t('admin.teams.creating') : t('admin.teams.create')}
      </Button>
    </form>
  )
}

function CredentialRow({ label, value, copied, onCopy, t }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-white px-3.5 py-2.5">
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-ink-400">{label}</p>
        <p className="truncate font-mono text-sm font-semibold text-ink-900">{value}</p>
      </div>
      <button
        type="button"
        onClick={onCopy}
        className="shrink-0 rounded-lg border border-ink-200 px-2.5 py-1.5 text-xs font-semibold text-ink-600 hover:bg-ink-50"
      >
        {copied ? t('admin.teams.created.copied') : t('admin.teams.created.copy')}
      </button>
    </div>
  )
}

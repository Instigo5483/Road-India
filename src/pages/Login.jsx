import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { LANGUAGES } from '../data/languages'
import { generateRandomName } from '../lib/randomName'
import Button from '../components/Button'
import LanguageSelector from '../components/LanguageSelector'
import {
  IconShieldCheck,
  IconChevronLeft,
  IconAlertCircle,
  IconFingerprint,
  IconLockCloud,
  IconLoader,
  IconUser,
  IconSiren,
} from '../components/Icons'

function formatId(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 12)
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim()
}

function isValidId(raw) {
  return raw.replace(/\D/g, '').length === 12
}

function generateId() {
  let digits = ''
  for (let i = 0; i < 12; i++) digits += Math.floor(Math.random() * 10)
  return digits
}

const METHODS = [
  {
    id: 'aadhaar',
    icon: IconFingerprint,
    labelKey: 'auth.method.aadhaar.label',
    descKey: 'auth.method.aadhaar.desc',
  },
  {
    id: 'digilocker',
    icon: IconLockCloud,
    labelKey: 'auth.method.digilocker.label',
    descKey: 'auth.method.digilocker.desc',
  },
]

// The generic "Log in" entry point offers all three sign-in types up
// front, since real municipal staff/response teams wouldn't know to look
// for a separate /admin or /team URL -- only "user" continues into this
// same page's Aadhaar/DigiLocker flow; the other two are entirely
// separate auth systems (see AdminAuthContext.jsx, TeamAuthContext.jsx)
// with their own routes.
const ROLES = [
  {
    id: 'user',
    icon: IconUser,
    labelKey: 'auth.role.user.label',
    descKey: 'auth.role.user.desc',
  },
  {
    id: 'admin',
    icon: IconLockCloud,
    labelKey: 'auth.role.admin.label',
    descKey: 'auth.role.admin.desc',
  },
  {
    id: 'team',
    icon: IconSiren,
    labelKey: 'auth.role.team.label',
    descKey: 'auth.role.team.desc',
  },
]

export default function Login() {
  const { completeLogin } = useAuth()
  const { t, lang } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname ?? '/home'

  const [stage, setStage] = useState('role') // 'role' | 'method' | 'id' | 'otp' | 'digilocker' | 'profile'
  const [method, setMethod] = useState('') // 'aadhaar' | 'digilocker' -- which verification path supplied the name
  const [digilockerId, setDigilockerId] = useState('')
  const [otp, setOtp] = useState('')
  const [name, setName] = useState('')
  const [preferredLanguage, setPreferredLanguage] = useState(lang)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const demoOtp = useMemo(
    () => String(Math.floor(100000 + Math.random() * 900000)),
    [stage]
  )

  // A real Aadhaar/DigiLocker verification returns the citizen's name as
  // part of the identity response -- this app never asks them to type it
  // themselves (see lib/randomName.js). But it should be *their real*
  // name, not just any freshly-made-up one: resolving the account here,
  // right after the ID is verified, means a returning citizen sees their
  // own existing name on the confirmation screen below, instead of a
  // brand-new random one that then gets silently swapped out the moment
  // they click "Enter Road India". The random name is only actually used
  // if this citizen has genuinely never signed in before.
  async function resolveIdentity(id) {
    const previewName = generateRandomName()
    try {
      const resolved = await completeLogin({
        digilockerId: id,
        name: previewName,
        preferredLanguage,
      })
      setName(resolved?.name || previewName)
    } catch {
      // Best-effort here -- if this fails (a real backend hiccup), show
      // the preview name for now; handleFinish's own completeLogin call
      // retries the real resolution before actually entering the app.
      setName(previewName)
    }
  }

  // DigiLocker path skips manual ID entry entirely -- a real DigiLocker
  // OAuth redirect already knows the user's verified identity, so this
  // simulates that hand-off with a brief "connecting" beat before landing
  // on the same profile step the Aadhaar path uses.
  useEffect(() => {
    if (stage !== 'digilocker') return
    let cancelled = false
    const id = generateId()
    setDigilockerId(id)

    Promise.all([resolveIdentity(id), new Promise((r) => setTimeout(r, 1200))]).then(() => {
      if (!cancelled) setStage('profile')
    })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage])

  function handleSendOtp(e) {
    e.preventDefault()
    if (!isValidId(digilockerId)) return setError(t('auth.error.invalidId'))
    setError('')
    setBusy(true)
    setTimeout(() => {
      setBusy(false)
      setStage('otp')
    }, 700)
  }

  async function handleVerifyOtp(e) {
    e.preventDefault()
    if (otp.trim().length !== 6) return setError(t('auth.error.invalidOtp'))
    setError('')
    setBusy(true)
    try {
      await new Promise((r) => setTimeout(r, 700))
      await resolveIdentity(digilockerId.replace(/\D/g, ''))
      setStage('profile')
    } finally {
      setBusy(false)
    }
  }

  async function handleFinish(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await completeLogin({
        digilockerId: digilockerId.replace(/\D/g, ''),
        name: name.trim(),
        preferredLanguage,
      })
      navigate(from, { replace: true })
    } catch {
      setError(t('auth.error.loginFailed'))
    } finally {
      setBusy(false)
    }
  }

  function selectMethod(methodId) {
    setError('')
    setMethod(methodId)
    if (methodId === 'aadhaar') {
      setStage('id')
    } else {
      setStage('digilocker')
    }
  }

  function selectRole(roleId) {
    if (roleId === 'admin') {
      navigate('/admin/login')
    } else if (roleId === 'team') {
      navigate('/team/login')
    } else {
      setStage('method')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4 py-10">
      <div className="w-full max-w-md">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-ink-500 hover:text-brand-700"
        >
          <IconChevronLeft className="h-4 w-4" />
          {t('auth.back')}
        </button>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-card-hover"
        >
          <div className="flex items-center justify-between bg-brand-900 px-6 py-5 text-white">
            <h1 className="text-lg font-bold">{t('auth.title')}</h1>
            <LanguageSelector />
          </div>

          <div className="px-6 py-6">
            <p className="mb-5 text-sm text-ink-500">{t('auth.subtitle')}</p>

            <motion.div
              key={stage}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.22 }}
            >
              {stage === 'role' && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-ink-700">
                    {t('auth.role.title')}
                  </p>
                  {ROLES.map((role) => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => selectRole(role.id)}
                      className="flex w-full items-center gap-3.5 rounded-xl border border-ink-200 bg-white px-4 py-3.5 text-left transition-colors hover:border-brand-300 hover:bg-brand-50"
                    >
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-600/10 text-brand-700">
                        <role.icon className="h-5.5 w-5.5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-ink-900">
                          {t(role.labelKey)}
                        </span>
                        <span className="block text-xs text-ink-500">
                          {t(role.descKey)}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {stage === 'method' && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-ink-700">
                    {t('auth.method.title')}
                  </p>
                  {METHODS.map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => selectMethod(method.id)}
                      className="flex w-full items-center gap-3.5 rounded-xl border border-ink-200 bg-white px-4 py-3.5 text-left transition-colors hover:border-brand-300 hover:bg-brand-50"
                    >
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-600/10 text-brand-700">
                        <method.icon className="h-5.5 w-5.5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-ink-900">
                          {t(method.labelKey)}
                        </span>
                        <span className="block text-xs text-ink-500">
                          {t(method.descKey)}
                        </span>
                      </span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setStage('role')}
                    className="w-full text-center text-xs font-medium text-ink-400 hover:text-brand-700"
                  >
                    {t('auth.role.chooseDifferent')}
                  </button>
                </div>
              )}

              {stage === 'id' && (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <Field label={t('auth.digilockerId.label')}>
                    <input
                      value={digilockerId}
                      onChange={(e) =>
                        setDigilockerId(formatId(e.target.value))
                      }
                      placeholder={t('auth.digilockerId.placeholder')}
                      inputMode="numeric"
                      className="input-field"
                      autoFocus
                    />
                  </Field>
                  <ErrorText message={error} />
                  <Button type="submit" className="w-full" loading={busy}>
                    {busy ? t('auth.sendingOtp') : t('auth.sendOtp')}
                  </Button>
                  <p className="text-center text-xs text-ink-400">
                    {t('auth.consent.text')}
                  </p>
                  <button
                    type="button"
                    onClick={() => setStage('method')}
                    className="w-full text-center text-xs font-medium text-ink-400 hover:text-brand-700"
                  >
                    {t('auth.method.chooseDifferent')}
                  </button>
                </form>
              )}

              {stage === 'otp' && (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <Field label={t('auth.otp.label')}>
                    <input
                      value={otp}
                      onChange={(e) =>
                        setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                      }
                      placeholder="••••••"
                      inputMode="numeric"
                      className="input-field tracking-[0.5em]"
                      autoFocus
                    />
                  </Field>
                  <p className="rounded-xl bg-brand-50 px-3 py-2 text-xs font-medium text-brand-700">
                    {t('auth.otp.hint', { otp: demoOtp })}
                  </p>
                  <ErrorText message={error} />
                  <Button type="submit" className="w-full" loading={busy}>
                    {busy ? t('auth.verifying') : t('auth.verify')}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setStage('id')}
                    className="w-full text-center text-xs font-medium text-ink-400 hover:text-brand-700"
                  >
                    {t('auth.switchAccount')}
                  </button>
                </form>
              )}

              {stage === 'digilocker' && (
                <div className="flex flex-col items-center gap-4 py-6 text-center">
                  <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-600/10 text-brand-700">
                    <IconLoader className="h-6 w-6" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink-900">
                      {t('auth.digilocker.connecting')}
                    </p>
                    <p className="mt-1 text-xs text-ink-500">
                      {t('auth.digilocker.subtitle')}
                    </p>
                  </div>
                </div>
              )}

              {stage === 'profile' && (
                <form onSubmit={handleFinish} className="space-y-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-success-700">
                    <IconShieldCheck className="h-4 w-4" />
                    {t('auth.profile.title')}
                  </p>
                  <div>
                    <span className="mb-1.5 block text-sm font-medium text-ink-700">
                      {method === 'digilocker'
                        ? t('auth.profile.name.fromDigilocker')
                        : t('auth.profile.name.fromAadhaar')}
                    </span>
                    <p className="rounded-xl bg-ink-50 px-3.5 py-2.5 text-sm font-semibold text-ink-900">
                      {name}
                    </p>
                  </div>
                  <Field label={t('auth.profile.language.label')}>
                    <select
                      value={preferredLanguage}
                      onChange={(e) => setPreferredLanguage(e.target.value)}
                      className="input-field"
                    >
                      {LANGUAGES.map((l) => (
                        <option key={l.code} value={l.code}>
                          {l.nativeLabel}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <ErrorText message={error} />
                  <Button type="submit" className="w-full" loading={busy}>
                    {t('auth.profile.finish')}
                  </Button>
                </form>
              )}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink-700">
        {label}
      </span>
      {children}
    </label>
  )
}

function ErrorText({ message }) {
  if (!message) return null
  return (
    <p className="flex items-center gap-1.5 text-xs font-medium text-emergency-600">
      <IconAlertCircle className="h-3.5 w-3.5" />
      {message}
    </p>
  )
}

import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/useAppContext'
import { useLanguage } from '../context/useAppContext'
import { LANGUAGES } from '../data/languages'
import { generateRandomName } from '../lib/randomName'
import Button from '../components/Button'
import Logo from '../components/Logo'
import LanguageSelector from '../components/LanguageSelector'
import {
  IconAlertCircle,
  IconArrowRight,
  IconChevronLeft,
  IconFingerprint,
  IconLockCloud,
  IconShieldCheck,
  IconUser,
} from '../components/Icons'

const DIGILOCKER_ID_KEY = 'road_india_mock_digilocker_id'

function formatId(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 12)
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim()
}

function plainId(value) {
  return value.replace(/\D/g, '')
}

function randomTwelveDigits() {
  return Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join('')
}

function getMockDigiLockerId() {
  try {
    const saved = localStorage.getItem(DIGILOCKER_ID_KEY)
    if (saved?.length === 12) return saved
    const generated = randomTwelveDigits()
    localStorage.setItem(DIGILOCKER_ID_KEY, generated)
    return generated
  } catch {
    return randomTwelveDigits()
  }
}

export default function Login() {
  const { completeLogin, logout } = useAuth()
  const { t, lang, setLang } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  const requestedPath = location.state?.from?.pathname
  const from = typeof requestedPath === 'string' && /^\/(?:home|dashboard|settings|reports|resolved|data|report\/[^/\\]+)$/.test(requestedPath) ? requestedPath : '/home'

  const [method, setMethod] = useState('aadhaar')
  const [aadhaarStage, setAadhaarStage] = useState('number')
  const [aadhaar, setAadhaar] = useState('')
  const [otp, setOtp] = useState('')
  const [screen, setScreen] = useState('auth')
  const [verifiedId, setVerifiedId] = useState('')
  const [accountName, setAccountName] = useState('')
  const [preferredLanguage, setPreferredLanguage] = useState(lang)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function selectMethod(nextMethod) {
    setMethod(nextMethod)
    setAadhaarStage('number')
    setOtp('')
    setError('')
  }

  function handleAadhaarNext(event) {
    event.preventDefault()
    if (plainId(aadhaar).length !== 12) {
      setError(t('auth.error.invalidId'))
      return
    }
    setError('')
    setAadhaarStage('otp')
  }

  async function verifyIdentity(id) {
    setBusy(true)
    setError('')
    try {
      const account = await completeLogin({
        digilockerId: id,
        name: generateRandomName(),
        preferredLanguage: lang,
      })
      setVerifiedId(id)
      setAccountName(account.name)
      setPreferredLanguage(account.preferredLanguage || lang)
      setScreen('profile')
    } catch {
      setError(t('auth.error.loginFailed'))
    } finally {
      setBusy(false)
    }
  }

  async function handleOtpSubmit(event) {
    event.preventDefault()
    if (otp.length !== 6) {
      setError(t('auth.error.invalidOtp'))
      return
    }
    await verifyIdentity(plainId(aadhaar))
  }

  async function handleDigiLockerLogin() {
    await verifyIdentity(getMockDigiLockerId())
  }

  async function handleProfileFinish(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await completeLogin({
        digilockerId: verifiedId,
        name: accountName,
        preferredLanguage,
      })
      setLang(preferredLanguage)
      navigate(from, { replace: true })
    } catch {
      setError(t('auth.error.loginFailed'))
    } finally {
      setBusy(false)
    }
  }

  async function chooseAnotherAccount() {
    try { await logout() } catch { setError(t('auth.error.loginFailed')); return }
    setScreen('auth')
    setAadhaarStage('number')
    setAadhaar('')
    setOtp('')
    setVerifiedId('')
    setAccountName('')
    setError('')
  }

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-ink-100 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <button type="button" onClick={() => navigate('/')} className="flex items-center gap-2 text-left">
            <Logo className="h-8 w-8" />
            <span className="font-display text-lg font-bold tracking-tight text-brand-900">{t('common.appName')}</span>
          </button>
          <div className="flex items-center gap-2">
            <LanguageSelector variant="neutral" />
            <span className="grid h-8 w-8 place-items-center rounded-full bg-accent-700 text-white">
              <IconUser className="h-4 w-4" />
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-8 pt-20 sm:px-6 lg:justify-center lg:py-24">
        <button type="button" onClick={() => navigate('/')} className="mb-4 inline-flex w-fit items-center gap-1 text-xs font-medium text-ink-500 transition-colors hover:text-accent-700">
          <IconChevronLeft className="h-4 w-4" />
          {t('auth.back')}
        </button>

        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-wider text-accent-700">{t('auth.portalLabel')}</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink-900">
            {screen === 'profile' ? t('auth.profile.title') : t('auth.title')}
          </h1>
          <p className="mt-1 text-sm leading-relaxed text-ink-500">
            {screen === 'profile' ? t('auth.profile.subtitle') : t('auth.subtitle')}
          </p>
        </div>

        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-ink-200 bg-white p-4 shadow-card sm:p-5">
          {screen === 'auth' ? (
            <>
              <div className="grid grid-cols-2 rounded-lg bg-ink-100 p-1">
                <button type="button" onClick={() => selectMethod('aadhaar')} className={`min-h-11 rounded-md px-2 text-xs font-semibold transition-all ${method === 'aadhaar' ? 'bg-white text-accent-800 shadow-sm' : 'text-ink-500'}`}>
                  {t('auth.method.aadhaar.label')} + OTP
                </button>
                <button type="button" onClick={() => selectMethod('digilocker')} className={`min-h-11 rounded-md px-2 text-xs font-semibold transition-all ${method === 'digilocker' ? 'bg-white text-brand-700 shadow-sm' : 'text-ink-500'}`}>
                  {t('auth.method.digilocker.label')}
                </button>
              </div>

              <motion.div key={`${method}-${aadhaarStage}`} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
            {method === 'aadhaar' && aadhaarStage === 'number' && (
              <form onSubmit={handleAadhaarNext} className="mt-5 space-y-4">
                <Field label={t('auth.digilockerId.label')}>
                  <div className="relative">
                    <IconFingerprint className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400" />
                    <input
                      value={aadhaar}
                      onChange={(event) => { setAadhaar(formatId(event.target.value)); setError('') }}
                      placeholder={t('auth.digilockerId.placeholder')}
                      inputMode="numeric"
                      autoComplete="off"
                      autoFocus
                      className="input-field h-12 pl-10 font-mono tracking-wider"
                    />
                  </div>
                </Field>
                <MockNotice icon={IconShieldCheck} text={t('auth.mock.aadhaarHint')} />
                <ErrorText message={error} />
                <Button type="submit" className="w-full" icon={<IconArrowRight className="h-4 w-4" />}>
                  {t('auth.aadhaar.next')}
                </Button>
              </form>
            )}

            {method === 'aadhaar' && aadhaarStage === 'otp' && (
              <form onSubmit={handleOtpSubmit} className="mt-5 space-y-4">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-ink-900">{t('auth.otp.label')}</p>
                      <p className="mt-1 text-xs text-ink-500">{t('auth.otp.sentTo', { id: aadhaar.slice(-4) })}</p>
                    </div>
                    <button type="button" onClick={() => { setAadhaarStage('number'); setOtp(''); setError('') }} className="text-xs font-semibold text-accent-700 hover:text-accent-800">
                      {t('auth.otp.change')}
                    </button>
                  </div>
                  <input
                    value={otp}
                    onChange={(event) => { setOtp(event.target.value.replace(/\D/g, '').slice(0, 6)); setError('') }}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    aria-label={t('auth.otp.label')}
                    autoFocus
                    placeholder="• • • • • •"
                    className="mt-3 h-12 w-full rounded-lg border border-ink-200 bg-ink-50 pl-[0.65em] text-center font-display text-lg font-bold tracking-[0.65em] text-ink-900 outline-none transition placeholder:tracking-[0.35em] focus:border-accent-500 focus:bg-white focus:ring-2 focus:ring-accent-100"
                  />
                </div>
                <MockNotice icon={IconShieldCheck} text={t('auth.mock.otpHint')} />
                <ErrorText message={error} />
                <Button type="submit" className="w-full" loading={busy} icon={<IconArrowRight className="h-4 w-4" />}>
                  {busy ? t('auth.verifying') : t('auth.verify')}
                </Button>
              </form>
            )}

            {method === 'digilocker' && (
              <div className="mt-5">
                <div className="rounded-xl bg-brand-50 p-4 text-center">
                  <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-white text-brand-700 shadow-sm">
                    <IconLockCloud className="h-6 w-6" />
                  </span>
                  <h2 className="mt-3 text-sm font-bold text-ink-900">{t('auth.digilocker.directTitle')}</h2>
                  <p className="mt-1 text-xs leading-relaxed text-ink-500">{t('auth.digilocker.directBody')}</p>
                </div>
                <MockNotice icon={IconShieldCheck} text={t('auth.mock.digilockerHint')} className="mt-4" />
                <ErrorText message={error} />
                <Button type="button" onClick={handleDigiLockerLogin} className="mt-4 w-full" loading={busy} icon={<IconArrowRight className="h-4 w-4" />}>
                  {t('auth.digilocker.authenticate')}
                </Button>
              </div>
            )}
              </motion.div>
            </>
          ) : (
            <motion.form key="profile" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }} onSubmit={handleProfileFinish} className="space-y-4">
              <div className="flex items-center gap-2 rounded-lg bg-success-50 px-3 py-2.5 text-sm font-semibold text-success-700">
                <IconShieldCheck className="h-4 w-4" />
                {t('auth.profile.verified')}
              </div>
              <div>
                <span className="mb-1.5 block text-sm font-semibold text-ink-800">
                  {method === 'digilocker' ? t('auth.profile.name.fromDigilocker') : t('auth.profile.name.fromAadhaar')}
                </span>
                <div className="flex items-center gap-3 rounded-xl bg-ink-50 px-3.5 py-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-100 font-display font-bold text-accent-800">
                    {accountName.charAt(0).toUpperCase()}
                  </span>
                  <p className="min-w-0 truncate text-sm font-bold text-ink-900">{accountName}</p>
                </div>
              </div>
              <Field label={t('auth.profile.language.label')}>
                <select value={preferredLanguage} onChange={(event) => setPreferredLanguage(event.target.value)} className="input-field h-12">
                  {LANGUAGES.map((language) => (
                    <option key={language.code} value={language.code}>{language.nativeLabel}</option>
                  ))}
                </select>
              </Field>
              <ErrorText message={error} />
              <Button type="submit" className="w-full" loading={busy} icon={<IconArrowRight className="h-4 w-4" />}>
                {t('auth.profile.finish')}
              </Button>
              <button type="button" onClick={chooseAnotherAccount} className="w-full text-center text-xs font-semibold text-ink-400 hover:text-accent-700">
                {t('auth.profile.useAnother')}
              </button>
            </motion.form>
          )}
        </motion.section>

        <p className="mt-4 text-center text-[11px] leading-relaxed text-ink-400">{t('auth.consent.text')}</p>
      </main>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-ink-800">{label}</span>
      {children}
    </label>
  )
}

function MockNotice({ icon: Icon, text, className = '' }) {
  return (
    <p className={`flex items-start gap-2 rounded-lg bg-success-50 px-3 py-2.5 text-xs leading-relaxed text-success-700 ${className}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      {text}
    </p>
  )
}

function ErrorText({ message }) {
  if (!message) return null
  return (
    <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-emergency-600">
      <IconAlertCircle className="h-3.5 w-3.5" />
      {message}
    </p>
  )
}

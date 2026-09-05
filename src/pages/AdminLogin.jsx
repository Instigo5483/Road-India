import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAdminAuth } from '../context/useAppContext'
import { ADMIN_PASSCODE } from '../lib/adminAccess'
import { useLanguage } from '../context/useAppContext'
import Button from '../components/Button'
import Logo from '../components/Logo'
import LanguageSelector from '../components/LanguageSelector'
import {
  IconAlertCircle,
  IconArrowRight,
  IconChevronLeft,
  IconLockCloud,
  IconShieldCheck,
} from '../components/Icons'

export default function AdminLogin() {
  const { loginAdmin } = useAdminAuth()
  const { t, lang } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname ?? '/admin'

  const [passcode, setPasscode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const authenticated = await loginAdmin(passcode)
      if (authenticated) navigate(from, { replace: true })
      else setError(t('admin.login.error'))
    } catch {
      setError(lang === 'hi'
        ? 'डेटाबेस साइन-इन नहीं हो सका। कनेक्शन और Firebase Authentication कॉन्फ़िगरेशन जाँचें, फिर पुनः प्रयास करें।'
        : 'Could not sign in to the database. Check your connection and Firebase Authentication configuration, then retry.')
    } finally {
      setBusy(false)
    }
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
            <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-800 text-white">
              <IconLockCloud className="h-4 w-4" />
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-8 pt-20 sm:px-6 lg:justify-center lg:py-24">
        <button type="button" onClick={() => navigate('/')} className="mb-4 inline-flex w-fit items-center gap-1 text-xs font-medium text-ink-500 transition-colors hover:text-accent-700">
          <IconChevronLeft className="h-4 w-4" />
          {t('admin.back')}
        </button>

        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-700">{t('admin.login.portalLabel')}</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink-900">{t('admin.login.title')}</h1>
          <p className="mt-1 text-sm leading-relaxed text-ink-500">{t('admin.login.subtitle')}</p>
        </div>

        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-ink-200 bg-white p-4 shadow-card sm:p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-ink-800">{t('admin.login.passcodeLabel')}</span>
              <div className="relative">
                <IconLockCloud className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400" />
                <input
                  type="password"
                  value={passcode}
                  onChange={(event) => { setPasscode(event.target.value); setError('') }}
                  placeholder={t('admin.login.placeholder')}
                  className="input-field h-12 pl-10"
                  autoFocus
                />
              </div>
            </label>

            <div className="rounded-lg border border-warning-200 bg-warning-50 p-3">
              <p className="flex items-center gap-1.5 text-xs font-bold text-warning-700">
                <IconShieldCheck className="h-4 w-4" />
                {t('admin.testCredentials.heading')}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-warning-600">{t('admin.testCredentials.note')}</p>
              <div className="mt-2 rounded-md bg-white px-3 py-2 text-xs">
                <span className="font-medium text-ink-500">{t('admin.login.passcodeLabel')}: </span>
                <span className="font-mono font-semibold text-ink-900">{ADMIN_PASSCODE}</span>
              </div>
            </div>

            {error && (
              <p className="flex items-center gap-1.5 text-xs font-medium text-emergency-600">
                <IconAlertCircle className="h-3.5 w-3.5" />
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" loading={busy} disabled={!passcode} icon={<IconArrowRight className="h-4 w-4" />}>
              {t('admin.login.submit')}
            </Button>
          </form>
        </motion.section>
      </main>
    </div>
  )
}

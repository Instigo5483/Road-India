import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAdminAuth } from '../context/AdminAuthContext'
import { useLanguage } from '../context/LanguageContext'
import Button from '../components/Button'
import { IconChevronLeft, IconAlertCircle, IconLockCloud } from '../components/Icons'

export default function AdminLogin() {
  const { loginAdmin } = useAdminAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname ?? '/admin'

  const [passcode, setPasscode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const ok = await loginAdmin(passcode)
      if (ok) {
        navigate(from, { replace: true })
      } else {
        setError(t('admin.login.error'))
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-ink-500 hover:text-brand-700"
        >
          <IconChevronLeft className="h-4 w-4" />
          {t('admin.back')}
        </button>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-2xl border border-ink-200 bg-white p-6 shadow-card-hover sm:p-8"
        >
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-600/10 text-brand-700">
            <IconLockCloud className="h-5.5 w-5.5" />
          </span>
          <h1 className="mt-4 text-lg font-bold text-ink-900">{t('admin.login.title')}</h1>
          <p className="mt-1 text-sm text-ink-500">{t('admin.login.subtitle')}</p>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink-700">
                {t('admin.login.passcodeLabel')}
              </span>
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder={t('admin.login.placeholder')}
                className="input-field"
                autoFocus
              />
            </label>

            {error && (
              <p className="flex items-center gap-1.5 text-xs font-medium text-emergency-600">
                <IconAlertCircle className="h-3.5 w-3.5" />
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" loading={busy} disabled={!passcode}>
              {t('admin.login.submit')}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}

import Navbar from '../components/Navbar'
import PageTransition from '../components/PageTransition'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { maskAadhaarId } from '../lib/format'
import { formatTimestamp } from '../lib/time'
import { IconUser, IconShieldCheck } from '../components/Icons'

export default function Settings() {
  const { user } = useAuth()
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-ink-50">
      <Navbar />
      <PageTransition className="mx-auto max-w-xl px-4 py-8 sm:px-6 sm:py-12">
        <h1 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl">{t('settings.title')}</h1>
        <p className="mt-1.5 text-ink-500">{t('settings.subtitle')}</p>

        <div className="mt-6 space-y-5 rounded-2xl border border-ink-200 bg-white p-6 shadow-card sm:p-8">
          <div className="flex items-center gap-3">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-ink-100 text-ink-500">
              <IconUser className="h-6 w-6" />
            </span>
            <div>
              <h2 className="font-bold text-ink-900">{t('settings.profile.heading')}</h2>
              <p className="text-xs text-ink-400">{t('settings.profile.subtitle')}</p>
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-sm font-medium text-ink-700">{t('settings.name.label')}</p>
            <p className="rounded-xl bg-ink-50 px-3.5 py-2.5 text-sm font-semibold text-ink-900">
              {user?.name}
            </p>
            <p className="mt-1.5 text-xs text-ink-400">{t('settings.name.note')}</p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-ink-200 bg-white p-6 shadow-card sm:p-8">
          <div className="flex items-center gap-2.5">
            <IconShieldCheck className="h-4.5 w-4.5 text-brand-700" />
            <h2 className="font-bold text-ink-900">{t('settings.account.heading')}</h2>
          </div>

          <dl className="mt-4 divide-y divide-ink-100 text-sm">
            <Row label={t('settings.account.id')} value={maskAadhaarId(user?.digilockerId)} />
            <Row
              label={t('settings.account.memberSince')}
              value={user?.createdAt ? formatTimestamp(user.createdAt) : '—'}
            />
          </dl>

          <p className="mt-4 text-xs leading-relaxed text-ink-400">{t('settings.account.privacyNote')}</p>
        </div>
      </PageTransition>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="text-ink-500">{label}</dt>
      <dd className="font-medium text-ink-800">{value}</dd>
    </div>
  )
}

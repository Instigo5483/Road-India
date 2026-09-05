import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import PageTransition from '../components/PageTransition'
import MobileBottomNav from '../components/MobileBottomNav'
import LanguageSelector from '../components/LanguageSelector'
import UserMenu from '../components/UserMenu'
import ReportCard from '../components/ReportCard'
import Logo from '../components/Logo'
import { useAuth } from '../context/useAppContext'
import { useReports } from '../context/useAppContext'
import { useLanguage } from '../context/useAppContext'
import { CATEGORIES, normalizeCategoryId } from '../data/categoryTypes'
import { toDate } from '../lib/time'
import {
  IconArrowRight,
  IconCamera,
  IconMapPin,
  IconCheckCircle,
  IconSparkle,
  IconShieldCheck,
  IconUser,
  IconListChecks,
} from '../components/Icons'
import heroHighway from '../assets/landing/hero-highway.jpg'

const REPORT_CATEGORY = CATEGORIES[0]

function Metric({ value, label, icon: Icon, tone = 'accent' }) {
  const toneClass =
    tone === 'success'
      ? 'bg-success-50 text-success-700'
      : tone === 'brand'
        ? 'bg-brand-50 text-brand-700'
        : 'bg-accent-50 text-accent-700'

  return (
    <div className="rounded-xl bg-ink-50 p-3.5 shadow-sm">
      <span className={`grid h-8 w-8 place-items-center rounded-lg ${toneClass}`}>
        <Icon className="h-4 w-4" />
      </span>
      <p className="mt-3 font-display text-2xl font-bold leading-none text-ink-900">{value}</p>
      <p className="mt-1 text-xs font-medium text-ink-500">{label}</p>
    </div>
  )
}

function Step({ number, title, body, active }) {
  return (
    <div className="flex items-start gap-3">
      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold ${active ? 'bg-accent-600 text-white' : 'bg-white text-ink-700'}`}>
        {number}
      </span>
      <div>
        <h3 className="text-sm font-bold text-ink-900">{title}</h3>
        <p className="mt-0.5 text-xs leading-relaxed text-ink-500">{body}</p>
      </div>
    </div>
  )
}

function IssueIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
      <path d="M12 3 2.8 20h18.4L12 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12 9v5M12 17.2v.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export default function Home() {
  const { user } = useAuth()
  const { reports, toggleUpvote } = useReports()
  const { t } = useLanguage()
  const navigate = useNavigate()

  const supportedReports = useMemo(
    () => reports.filter((report) => normalizeCategoryId(report.category) === 'issue'),
    [reports]
  )
  const resolvedReports = useMemo(
    () => supportedReports
      .filter((report) => report.status === 'resolved')
      .sort((a, b) => toDate(b.resolvedAt || b.createdAt) - toDate(a.resolvedAt || a.createdAt)),
    [supportedReports]
  )
  const metrics = useMemo(() => {
    const cities = new Set(supportedReports.map((report) => report.location?.city).filter(Boolean))
    const rated = resolvedReports.filter((report) => report.citizenFeedback?.rating)
    const satisfaction = rated.length
      ? Math.round((rated.reduce((sum, report) => sum + report.citizenFeedback.rating, 0) / (rated.length * 5)) * 100)
      : 0
    return { filed: supportedReports.length, resolved: resolvedReports.length, satisfaction, cities: cities.size }
  }, [supportedReports, resolvedReports])

  const activeCount = supportedReports.filter((report) => report.status !== 'resolved').length
  const desktopLinks = [
    { to: '/home', key: 'nav.home' },
    { to: '/reports', key: 'nav.reports' },
    { to: '/resolved', key: 'nav.resolved' },
    { to: '/data', key: 'nav.data' },
    ...(user ? [{ to: '/dashboard', key: 'nav.dashboard' }] : []),
  ]

  function openReportFlow() {
    const path = '/report/issue'
    if (user) navigate(path)
    else navigate('/login', { state: { from: { pathname: path } } })
  }

  return (
    <div className="min-h-screen bg-ink-50 pb-20 lg:pb-0">
      <header className="sticky top-0 z-30 border-b border-ink-100 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <button type="button" onClick={() => navigate('/home')} className="flex min-w-0 items-center gap-2 text-left">
            <Logo className="h-8 w-8 shrink-0" />
            <div className="min-w-0">
              <span className="block truncate text-sm font-extrabold uppercase tracking-tight text-brand-900">{t('common.appName')}</span>
              <span className="block max-w-28 truncate text-[10px] leading-tight text-ink-400">{user ? user.name : t('nav.home')}</span>
            </div>
          </button>

          <div className="hidden items-center gap-1 lg:flex">
            {desktopLinks.map(({ to, key }) => (
              <button
                key={to}
                type="button"
                onClick={() => navigate(to)}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  to === '/home'
                    ? 'bg-accent-50 text-accent-700'
                    : 'text-ink-500 hover:bg-ink-50 hover:text-ink-900'
                }`}
              >
                {t(key)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <LanguageSelector variant="neutral" />
            {user ? <UserMenu /> : (
              <button type="button" onClick={() => navigate('/login')} aria-label={t('landing.nav.login')} className="grid h-9 w-9 place-items-center rounded-full bg-brand-800 text-white shadow-sm">
                <IconUser className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      <PageTransition className="mx-auto max-w-6xl">
        <section className="px-4 pb-5 pt-5 sm:px-6 sm:pt-10">
          <div className="grid items-center gap-6 lg:grid-cols-2 lg:gap-12">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-accent-700">
                <IconSparkle className="h-4 w-4" /> {t('landing.hero.eyebrow')}
              </div>
              <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-2 max-w-xl font-display text-3xl font-bold leading-tight tracking-tight text-ink-900 sm:text-5xl">
                {t('landing.hero.title')}
              </motion.h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-500 sm:text-base">{t('landing.hero.subtitle')}</p>

              <button type="button" onClick={openReportFlow} className="mt-5 flex min-h-16 w-full items-center justify-between gap-3 rounded-xl bg-accent-600 px-4 py-3.5 text-white shadow-[0_10px_28px_-12px_rgba(234,88,12,0.65)] transition-transform active:scale-[0.98] lg:max-w-xl">
                <span className="flex min-w-0 items-center gap-3 text-left">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/20"><IconCamera className="h-5 w-5" /></span>
                  <span className="min-w-0">
                    <span className="block text-base font-bold">{t('home.unified.cta')}</span>
                    <span className="block truncate text-[11px] font-medium text-white/85">{t('home.unified.ctaHint')}</span>
                  </span>
                </span>
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/20"><IconArrowRight className="h-4 w-4" /></span>
              </button>

              <button type="button" onClick={() => navigate('/reports')} className="mx-auto mt-3 flex items-center gap-1.5 text-sm font-semibold text-ink-600 hover:text-accent-700 lg:mx-0">
                <IconMapPin className="h-4 w-4" />
                {t('home.unified.browse', { count: activeCount })}
                <IconArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="relative h-48 overflow-hidden rounded-xl bg-ink-900 shadow-card-hover sm:h-72 lg:h-96">
              <img src={heroHighway} alt="" className="h-full w-full object-cover opacity-70" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-transparent to-transparent" />
              <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-3 text-white">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent-600"><IconShieldCheck className="h-4 w-4" /></span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold">{t('home.unified.liveTitle')}</p>
                    <p className="truncate text-[10px] text-white/70">{t('home.unified.liveSubtitle')}</p>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-white/15 px-2 py-1 text-[10px] font-semibold backdrop-blur">{t('home.unified.live')}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 pb-6 sm:px-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-ink-800">{t('home.unified.impact')}</h2>
            <span className="text-[11px] text-ink-400">{t('resolved.liveData')}</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <Metric value={metrics.filed.toLocaleString()} label={t('data.totalReports')} icon={IconListChecks} />
            <Metric value={metrics.resolved.toLocaleString()} label={t('data.resolvedReports')} icon={IconCheckCircle} tone="success" />
            <Metric value={`${metrics.satisfaction}%`} label={t('resolved.stats.rating')} icon={IconShieldCheck} tone="brand" />
            <Metric value={metrics.cities.toLocaleString()} label={t('landing.stats.cities')} icon={IconMapPin} tone="brand" />
          </div>
        </section>

        <section className="px-4 pb-6 sm:px-6">
          <div className="mb-3">
            <h2 className="font-display text-xl font-bold text-ink-900 sm:text-2xl">{t('home.unified.selectTitle')}</h2>
            <p className="mt-1 text-xs leading-relaxed text-ink-500">{t('home.unified.selectSubtitle')}</p>
          </div>
          <button type="button" onClick={openReportFlow} className="w-full rounded-xl border border-ink-100 bg-white p-4 text-left shadow-card transition-transform active:scale-[0.99]">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent-100 text-accent-700"><IssueIcon /></span>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-ink-900">{t(REPORT_CATEGORY.labelKey)}</h3>
                <p className="mt-0.5 text-xs text-ink-500">{t(REPORT_CATEGORY.taglineKey)}</p>
              </div>
              <IconArrowRight className="h-5 w-5 shrink-0 text-accent-600" />
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {REPORT_CATEGORY.types.map((type) => (
                <span key={type.id} className="rounded-full bg-ink-50 px-2.5 py-1 text-[11px] font-medium text-ink-600">{t(type.labelKey)}</span>
              ))}
            </div>
          </button>
        </section>

        <section className="px-4 pb-6 sm:px-6">
          <div className="rounded-xl bg-ink-100 p-5">
            <div className="mb-4 flex items-center gap-2"><IconSparkle className="h-5 w-5 text-accent-600" /><h2 className="text-xs font-bold uppercase tracking-wider text-ink-900">{t('landing.how.title')}</h2></div>
            <div className="space-y-4">
              <Step number="1" active title={t('landing.how.step1.title')} body={t('landing.how.step1.body')} />
              <Step number="2" title={t('landing.how.step2.title')} body={t('landing.how.step2.body')} />
              <Step number="3" title={t('landing.how.step3.title')} body={t('landing.how.step3.body')} />
            </div>
          </div>
        </section>

        {resolvedReports.length > 0 && (
          <section className="px-4 pb-6 sm:px-6">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div><span className="text-[11px] font-bold uppercase tracking-wider text-success-600">{t('landing.recent.eyebrow')}</span><h2 className="mt-0.5 font-display text-xl font-bold text-ink-900">{t('landing.recent.title')}</h2></div>
              <button type="button" onClick={() => navigate('/resolved')} className="text-xs font-semibold text-brand-700">{t('landing.recent.viewAll')}</button>
            </div>
            <div className="space-y-3">
              {resolvedReports.slice(0, 2).map((report, index) => (
                <ReportCard key={report.id} report={report} index={index} showUpvote={Boolean(user)} upvoted={Boolean(user && (report.upvotedBy ?? []).includes(user.uid))} onUpvote={() => (user ? toggleUpvote(report.id) : navigate('/login'))} />
              ))}
            </div>
          </section>
        )}

        <section className="px-4 pb-8 sm:px-6">
          <div className="rounded-xl bg-brand-50 p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-100 text-brand-700"><IconShieldCheck className="h-5 w-5" /></span>
              <div><h2 className="text-sm font-bold text-ink-900">{t('home.unified.trustTitle')}</h2><p className="mt-0.5 text-xs text-ink-500">{t('home.unified.trustSubtitle')}</p></div>
            </div>
          </div>
        </section>
      </PageTransition>
      <MobileBottomNav />
    </div>
  )
}

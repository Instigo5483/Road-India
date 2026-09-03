import { useEffect, useMemo, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { motion, animate } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useReports } from '../context/ReportsContext'
import { useLanguage } from '../context/LanguageContext'
import LanguageSelector from '../components/LanguageSelector'
import Button from '../components/Button'
import Logo from '../components/Logo'
import CategoryIcon from '../components/CategoryIcon'
import StatusBadge from '../components/StatusBadge'
import { CATEGORIES, getCategory, getTypesLabel, reportTypeIds } from '../data/categoryTypes'
import { toDate, timeAgo } from '../lib/time'
import { IconArrowRight, IconMapPin, IconSiren, IconLocate, IconClock, IconChevronRight } from '../components/Icons'
import heroHighway from '../assets/landing/hero-highway.jpg'
import heroWorker from '../assets/landing/hero-worker.jpg'
import heroHazardMap from '../assets/landing/hero-hazard-map.jpg'
import stepSnapSend from '../assets/landing/step-snap-send.jpg'
import stepLiveUpdates from '../assets/landing/step-live-updates.jpg'

const HOW_STEPS = [
  {
    image: stepSnapSend,
    titleKey: 'landing.how.step1.title',
    bodyKey: 'landing.how.step1.body',
    theme: 'accent',
  },
  {
    titleKey: 'landing.how.step2.title',
    bodyKey: 'landing.how.step2.body',
    theme: 'brand',
  },
  {
    image: stepLiveUpdates,
    titleKey: 'landing.how.step3.title',
    bodyKey: 'landing.how.step3.body',
    theme: 'success',
  },
]

/** Decorative "signal routing" graphic for the one How-It-Works step with
 * no photo (the routing step is a backend/algorithmic thing, not something
 * a camera can point at) -- concentric rings plus a pulsing ping dot,
 * tinted to the step's theme color. */
function RoutingGraphic({ className }) {
  return (
    <svg viewBox="0 0 200 150" fill="none" className={className} aria-hidden="true">
      <circle
        cx="100"
        cy="75"
        r="50"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="4 4"
        className="origin-center animate-[spin_10s_linear_infinite] opacity-20"
      />
      <circle
        cx="100"
        cy="75"
        r="30"
        stroke="currentColor"
        strokeWidth="2"
        className="origin-center animate-[spin_6s_linear_infinite_reverse] opacity-40"
      />
      <path d="M50 75 L150 75 M100 25 L100 125" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      <circle cx="100" cy="75" r="8" fill="currentColor" />
      <circle cx="60" cy="40" r="4" fill="currentColor" className="animate-ping" />
      <path d="M100 75 L60 40" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" opacity="0.5" />
    </svg>
  )
}

const STEP_PANEL_BG = {
  accent: 'bg-accent-50',
  brand: 'bg-brand-50',
  success: 'bg-success-50',
}

const STEP_BADGE_BG = {
  accent: 'bg-accent-500',
  brand: 'bg-brand-600',
  success: 'bg-success-600',
}

const STEP_ICON_COLOR = {
  accent: 'text-accent-600',
  brand: 'text-brand-600',
  success: 'text-success-600',
}

const STEP_OFFSET = ['', 'md:mt-10', 'md:mt-20']

const CATEGORY_CTA = {
  accent: 'text-accent-700',
  brand: 'text-brand-700',
  emergency: 'text-emergency-700',
}

const CARD_BAR_COLOR = {
  accent: 'bg-accent-500',
  brand: 'bg-brand-600',
  emergency: 'bg-emergency-600',
}

/** Counts up from 0 to the real value on mount/whenever it changes, rather
 * than just appearing -- a live stat pulled from the reports collection
 * reads as more "real" ticking upward than a static number. */
function AnimatedStat({ value, className }) {
  const [displayed, setDisplayed] = useState(0)

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 1.4,
      ease: 'easeOut',
      onUpdate: (latest) => setDisplayed(Math.round(latest)),
    })
    return () => controls.stop()
  }, [value])

  return <motion.p className={className}>{displayed.toLocaleString()}</motion.p>
}

/** A read-only summary row for the landing page's "Recently resolved"
 * teaser -- deliberately not the full ReportCard (which pulls in the
 * detail modal and its Leaflet map view). Landing loads eagerly for every
 * visitor, logged in or not, so keeping this teaser map-free is what keeps
 * Leaflet's ~45KB gzip chunk out of that eager bundle. */
function RecentReportRow({ report, index, onOpen }) {
  const { t, lang } = useLanguage()
  const category = getCategory(report.category)
  const typeLabel = getTypesLabel(t, report.category, reportTypeIds(report))
  const barColor = CARD_BAR_COLOR[category?.theme] ?? 'bg-ink-300'

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: Math.min(index * 0.06, 0.24), duration: 0.35 }}
      className="relative flex flex-col gap-4 overflow-hidden rounded-xl border border-ink-200 bg-white p-5 shadow-card sm:flex-row sm:items-center sm:justify-between"
    >
      <span className={`absolute inset-y-0 left-0 w-1.5 ${barColor}`} aria-hidden="true" />

      <div className="flex items-start gap-4 pl-2.5">
        <div className="shrink-0 overflow-hidden rounded-full">
          <CategoryIcon category={report.category} className="h-12 w-12" />
        </div>
        <div className="min-w-0">
          <h4 className="truncate font-semibold text-ink-900">
            {typeLabel || report.type}
          </h4>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-500">
            <span className="inline-flex items-center gap-1">
              <IconClock className="h-3.5 w-3.5" />
              {timeAgo(report.resolvedAt ?? report.createdAt, lang === 'hi' ? 'hi-IN' : 'en-IN')}
            </span>
            <span className="inline-flex items-center gap-1">
              <IconMapPin className="h-3.5 w-3.5" />
              {report.location?.address ?? t('report.step2.coordinates')}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 pl-2.5 sm:pl-0">
        <StatusBadge status={report.status} />
        <button
          type="button"
          onClick={onOpen}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700"
          aria-label={t('landing.recent.viewAll')}
        >
          <IconChevronRight className="h-5 w-5" />
        </button>
      </div>
    </motion.div>
  )
}

export default function Landing() {
  const { user, loading } = useAuth()
  const { reports } = useReports()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()

  // Real counts from the reports collection (publicly readable, see
  // firestore.rules) -- no login required to compute these, so the landing
  // page never shows made-up numbers.
  const stats = useMemo(() => {
    const cities = new Set(reports.map((r) => r.location?.city).filter(Boolean))
    const resolved = reports.filter((r) => r.status === 'resolved')

    return [
      { key: 'landing.stats.hazardsCleared', value: resolved.length, color: 'text-success-600' },
      { key: 'landing.stats.reported', value: reports.length, color: 'text-brand-600' },
      { key: 'landing.stats.cities', value: cities.size, color: 'text-ink-900' },
    ]
  }, [reports])

  const recentResolved = useMemo(
    () =>
      reports
        .filter((r) => r.status === 'resolved' && r.resolvedAt)
        .sort((a, b) => toDate(b.resolvedAt).getTime() - toDate(a.resolvedAt).getTime())
        .slice(0, 3),
    [reports]
  )

  // Logged-in users land here automatically get bounced to /home -- landing
  // is a marketing/logged-out page. The one exception is the navbar's own
  // "Road India" logo, which intentionally brings a logged-in user back to
  // this page (see Navbar.jsx) rather than being a no-op click straight
  // back to /home.
  if (!loading && user && !location.state?.fromNav) {
    return <Navigate to="/home" replace />
  }

  return (
    <div className="min-h-screen bg-white text-ink-900">
      <header className="sticky top-0 z-30 border-b border-ink-200 bg-white/95 shadow-card backdrop-blur-md">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-brand-900">
            <Logo className="h-9 w-9" />
            {t('common.appName')}
          </div>

          <nav className="hidden items-center gap-7 text-sm font-medium text-ink-600 lg:flex">
            <a href="#how-it-works" className="transition-colors hover:text-brand-700">
              {t('landing.nav.howItWorks')}
            </a>
            <a href="#categories" className="transition-colors hover:text-brand-700">
              {t('landing.nav.categories')}
            </a>
            <button
              type="button"
              onClick={() => navigate('/resolved')}
              className="transition-colors hover:text-brand-700"
            >
              {t('landing.nav.resolved')}
            </button>
            <button
              type="button"
              onClick={() => navigate('/data')}
              className="transition-colors hover:text-brand-700"
            >
              {t('landing.nav.data')}
            </button>
          </nav>

          <div className="flex items-center gap-2.5">
            <div className="hidden sm:block">
              <LanguageSelector variant="neutral" />
            </div>
            <Button
              size="sm"
              variant="danger"
              icon={<IconSiren className="h-4 w-4" />}
              onClick={() => navigate('/login')}
              className="hidden uppercase tracking-wide sm:inline-flex"
            >
              {t('landing.nav.reportEmergency')}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => navigate('/login')}>
              {t('landing.nav.login')}
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-b from-brand-50/70 via-white to-white">
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.35]"
            viewBox="0 0 1440 900"
            fill="none"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
          >
            <path d="M0 100 Q 300 300 720 150 T 1440 250" stroke="#cbd5e1" strokeDasharray="10 10" strokeWidth="1.5" />
            <path d="M0 250 Q 400 100 850 400 T 1440 300" stroke="#2563eb" strokeOpacity="0.15" strokeWidth="2" />
            <path d="M0 450 Q 500 600 900 200 T 1440 500" stroke="#cbd5e1" strokeWidth="1" />
            <path d="M0 700 Q 350 500 720 750 T 1440 600" stroke="#2563eb" strokeOpacity="0.08" strokeWidth="3" />
          </svg>

          <div className="relative mx-auto flex max-w-6xl flex-col gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:flex-row lg:items-center">
            <div className="flex-1">
              <motion.span
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="eyebrow-pill inline-flex items-center gap-2 bg-brand-600/10 text-brand-700"
              >
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-600" />
                {t('landing.hero.eyebrow')}
              </motion.span>

              <motion.h1
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
                className="relative mt-5 max-w-xl font-display text-3xl font-bold leading-tight tracking-tight text-ink-900 sm:text-5xl"
              >
                {t('landing.hero.title')}
                <span className="mt-4 block h-1 w-20 rounded-full bg-gradient-to-r from-brand-600 to-accent-500" />
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.16 }}
                className="mt-5 max-w-xl text-base text-ink-500 sm:text-lg"
              >
                {t('landing.hero.subtitle')}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.24 }}
                className="relative mt-8 grid gap-4 sm:grid-cols-2"
              >
                <div className="pointer-events-none absolute left-0 top-1/2 hidden h-px w-full -translate-y-1/2 bg-gradient-to-r from-transparent via-ink-200 to-transparent sm:block" />

                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl bg-emergency-600 p-6 text-left shadow-[0_12px_40px_-12px_rgba(181,44,44,0.5)] transition-transform duration-300 hover:-translate-y-1.5"
                >
                  <span className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl transition-transform duration-700 group-hover:scale-150" />
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-white/15 shadow-inner">
                    <IconSiren className="h-6 w-6 animate-pulse text-white" />
                  </span>
                  <div>
                    <h2 className="font-display text-lg font-bold text-white">
                      {t('landing.hero.emergencyCard.title')}
                    </h2>
                    <p className="mt-1.5 text-sm text-white/85">
                      {t('landing.hero.emergencyCard.body')}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-white">
                    <span className="text-xs font-bold uppercase tracking-wider">
                      {t('landing.hero.emergencyCard.cta')}
                    </span>
                    <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1.5" />
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-ink-200 bg-white p-6 text-left shadow-card transition-transform duration-300 hover:-translate-y-1.5 hover:shadow-card-hover"
                >
                  <span className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-brand-600/5 blur-2xl transition-transform duration-700 group-hover:scale-150" />
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-ink-100 shadow-inner">
                    <IconMapPin className="h-6 w-6 text-brand-600" />
                  </span>
                  <div>
                    <h2 className="font-display text-lg font-bold text-ink-900">
                      {t('landing.hero.reportCard.title')}
                    </h2>
                    <p className="mt-1.5 text-sm text-ink-500">
                      {t('landing.hero.reportCard.body')}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-ink-700">
                    <span className="text-xs font-bold uppercase tracking-wider text-ink-500">
                      {t('landing.hero.reportCard.cta')}
                    </span>
                    <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1.5" />
                  </div>
                </button>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.32 }}
                className="mt-5 text-xs font-medium text-ink-400"
              >
                {t('landing.hero.trust')}
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="hidden flex-1 grid-cols-2 grid-rows-2 gap-4 self-stretch lg:grid"
            >
              <div className="relative col-span-1 row-span-2 flex flex-col justify-end overflow-hidden rounded-3xl border border-ink-100 shadow-card-hover">
                <img src={heroHighway} alt="" className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="relative m-5 flex items-center gap-2 rounded-xl bg-white/95 px-3.5 py-2.5 shadow-card">
                  <IconLocate className="h-4 w-4 shrink-0 text-emergency-600" />
                  <span className="text-xs font-semibold text-ink-800">
                    {t('landing.hero.mosaic.tracked')}
                  </span>
                </div>
              </div>
              <div className="relative overflow-hidden rounded-3xl border border-ink-100 shadow-card">
                <img src={heroWorker} alt="" className="absolute inset-0 h-full w-full object-cover" />
              </div>
              <div className="relative overflow-hidden rounded-3xl border border-ink-100 shadow-card">
                <img src={heroHazardMap} alt="" className="absolute inset-0 h-full w-full object-cover" />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Impact stats bar */}
        <section className="border-y border-ink-100 bg-ink-50">
          <div className="mx-auto grid max-w-6xl grid-cols-3 gap-8 px-4 py-10 sm:px-6">
            {stats.map((stat) => (
              <div key={stat.key} className="flex flex-col items-center text-center">
                <AnimatedStat
                  value={stat.value}
                  className={`font-display text-3xl font-bold tabular-nums sm:text-4xl ${stat.color}`}
                />
                <p className="mt-1.5 text-xs font-semibold uppercase tracking-widest text-ink-500 sm:text-sm">
                  {t(stat.key)}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
            <span className="eyebrow-pill bg-accent-500/10 text-accent-600">
              {t('landing.how.eyebrow')}
            </span>
            <h2 className="mt-4 font-display text-2xl font-bold text-ink-900 sm:text-3xl">
              {t('landing.how.title')}
            </h2>

            <div className="mt-14 grid gap-x-8 gap-y-10 text-left sm:grid-cols-3">
              {HOW_STEPS.map((step, i) => (
                <motion.div
                  key={step.titleKey}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className={`group relative flex flex-col gap-5 ${STEP_OFFSET[i]}`}
                >
                  {i > 0 && (
                    <div className="pointer-events-none absolute -left-4 top-16 hidden h-px w-8 bg-ink-200 sm:block" />
                  )}
                  <div
                    className={`relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-[1.75rem] shadow-card ${STEP_PANEL_BG[step.theme]}`}
                  >
                    <span
                      className={`absolute left-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full text-sm font-bold text-white shadow-card ${STEP_BADGE_BG[step.theme]}`}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    {step.image ? (
                      <img
                        src={step.image}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <RoutingGraphic className={`h-full w-full p-8 ${STEP_ICON_COLOR[step.theme]}`} />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-ink-900">{t(step.titleKey)}</h3>
                    <p className="mt-1.5 text-sm text-ink-500">{t(step.bodyKey)}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Categories */}
        <section id="categories" className="border-t border-ink-100 bg-ink-50 py-16 sm:py-20">
          <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
            <span className="eyebrow-pill bg-brand-600/10 text-brand-700">
              {t('landing.categories.eyebrow')}
            </span>
            <h2 className="mt-4 font-display text-2xl font-bold text-ink-900 sm:text-3xl">
              {t('landing.categories.title')}
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-ink-500 sm:text-base">
              {t('landing.categories.subtitle')}
            </p>

            <div className="mt-10 grid gap-4 text-left sm:grid-cols-3">
              {CATEGORIES.map((category, i) => (
                <motion.button
                  key={category.id}
                  type="button"
                  onClick={() => navigate('/login')}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                  whileHover={{ y: -4 }}
                  className="flex h-full flex-col justify-between rounded-2xl border border-ink-200 bg-white p-8 text-left transition-shadow duration-300 hover:shadow-card-hover"
                >
                  <div>
                    <div className="inline-block overflow-hidden rounded-xl">
                      <CategoryIcon category={category.id} className="h-14 w-14" />
                    </div>
                    <h3 className="mt-4 text-lg font-bold text-ink-900">{t(category.labelKey)}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-500">
                      {t(category.taglineKey)}
                    </p>
                  </div>
                  <div
                    className={`mt-6 flex items-center gap-1.5 text-sm font-semibold ${CATEGORY_CTA[category.theme]}`}
                  >
                    <span>{t('landing.categories.cta')}</span>
                    <IconArrowRight className="h-4 w-4" />
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </section>

        {/* Recently resolved */}
        {recentResolved.length > 0 && (
          <section className="border-t border-ink-100 bg-white py-16 sm:py-20">
            <div className="mx-auto max-w-4xl px-4 sm:px-6">
              <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <span className="eyebrow-pill bg-success-500/10 text-success-600">
                    {t('landing.recent.eyebrow')}
                  </span>
                  <h2 className="mt-3 font-display text-2xl font-bold text-ink-900 sm:text-3xl">
                    {t('landing.recent.title')}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/resolved')}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline"
                >
                  {t('landing.recent.viewAll')}
                  <IconArrowRight className="h-4 w-4" />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                {recentResolved.map((report, i) => (
                  <RecentReportRow
                    key={report.id}
                    report={report}
                    index={i}
                    onOpen={() => navigate('/resolved')}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA banner */}
        <section className="px-4 py-16 sm:px-6 sm:py-20">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.4 }}
            className="mx-auto max-w-4xl rounded-3xl bg-gradient-to-br from-brand-800 via-brand-900 to-brand-950 px-6 py-14 text-center text-white sm:px-14"
          >
            <h2 className="font-display text-2xl font-bold sm:text-3xl">
              {t('landing.cta.banner.title')}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-brand-100/90 sm:text-base">
              {t('landing.cta.banner.subtitle')}
            </p>
            <div className="mt-8 flex justify-center">
              <Button size="lg" onClick={() => navigate('/login')}>
                {t('landing.cta.login')}
                <IconArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        </section>
      </main>

      <footer className="border-t border-ink-100 bg-ink-50">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-base font-extrabold tracking-tight text-brand-900">
              <Logo className="h-7 w-7" />
              {t('common.appName')}
            </div>
            <p className="text-sm text-ink-500">{t('landing.footer.builtFor')}</p>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-ink-400">
              {t('landing.footer.explore')}
            </h4>
            <a href="#how-it-works" className="text-sm text-ink-600 transition-colors hover:text-brand-700">
              {t('landing.nav.howItWorks')}
            </a>
            <a href="#categories" className="text-sm text-ink-600 transition-colors hover:text-brand-700">
              {t('landing.nav.categories')}
            </a>
            <button
              type="button"
              onClick={() => navigate('/resolved')}
              className="text-left text-sm text-ink-600 transition-colors hover:text-brand-700"
            >
              {t('landing.nav.resolved')}
            </button>
            <button
              type="button"
              onClick={() => navigate('/data')}
              className="text-left text-sm text-ink-600 transition-colors hover:text-brand-700"
            >
              {t('landing.nav.data')}
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-ink-400">
              {t('landing.footer.language')}
            </h4>
            <LanguageSelector variant="neutral" />
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-ink-400">
              {t('landing.footer.about')}
            </h4>
            <p className="text-sm leading-relaxed text-ink-500">{t('landing.footer.hackathonNote')}</p>
          </div>
        </div>

        <div className="border-t border-ink-100">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-ink-400 sm:flex-row sm:px-6">
            <span>{t('landing.footer.copyright', { year: new Date().getFullYear() })}</span>
            <span>{t('landing.footer.hackathonBadge')}</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

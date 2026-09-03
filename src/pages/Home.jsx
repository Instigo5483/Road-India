import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'
import PageTransition from '../components/PageTransition'
import ReportCard from '../components/ReportCard'
import EmptyState from '../components/EmptyState'
import { useAuth } from '../context/AuthContext'
import { useReports } from '../context/ReportsContext'
import { useLanguage } from '../context/LanguageContext'
import { CATEGORIES } from '../data/categoryTypes'
import { toDate } from '../lib/time'
import {
  IconArrowRight,
  IconAlertCircle,
  IconShieldCheck,
  IconSiren,
  IconSparkle,
  IconPhone,
  IconListChecks,
} from '../components/Icons'

const CATEGORY_ICON = {
  problem: IconAlertCircle,
  corruption: IconShieldCheck,
  emergency: IconSiren,
}

const CATEGORY_THEME = {
  accent: {
    bar: 'bg-accent-500',
    iconBg: 'bg-accent-100 text-accent-700',
    badge: 'bg-accent-50 text-accent-700',
    button: 'bg-accent-500 text-white hover:bg-accent-600',
    hoverTitle: 'group-hover:text-accent-700',
  },
  brand: {
    bar: 'bg-brand-600',
    iconBg: 'bg-brand-100 text-brand-700',
    badge: 'bg-brand-50 text-brand-700',
    button: 'bg-brand-700 text-white hover:bg-brand-800',
    hoverTitle: 'group-hover:text-brand-700',
  },
  emergency: {
    bar: 'bg-emergency-600',
    iconBg: 'bg-emergency-100 text-emergency-700',
    badge: 'bg-emergency-600 text-white',
    button: 'bg-emergency-600 text-white hover:bg-emergency-700',
    hoverTitle: 'group-hover:text-emergency-700',
  },
}

const CATEGORY_BADGE_KEY = {
  problem: 'home.category.badge.problem',
  corruption: 'home.category.badge.corruption',
  emergency: 'home.category.badge.emergency',
}

/** A bolder, dashboard-flavored take on the report-category action card
 * (colored spine, icon tile, badge chip, full-width CTA) -- distinct from
 * the lighter CategoryCard used on Landing, since this is the citizen's
 * working dashboard rather than a marketing page. */
function ReportCategoryCard({ category, index }) {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const theme = CATEGORY_THEME[category.theme]
  const Icon = CATEGORY_ICON[category.id]
  const label = t(category.labelKey)

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4, ease: 'easeOut' }}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-ink-200 bg-white p-6 shadow-card transition-shadow duration-300 hover:shadow-card-hover"
    >
      <span className={`absolute inset-y-0 left-0 w-1.5 ${theme.bar}`} aria-hidden="true" />

      <div className="space-y-4 pl-2">
        <div className="flex items-center justify-between">
          <span className={`grid h-14 w-14 place-items-center rounded-xl shadow-sm ${theme.iconBg}`}>
            <Icon className="h-7 w-7" />
          </span>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${theme.badge}`}>
            {t(CATEGORY_BADGE_KEY[category.id])}
          </span>
        </div>

        <div>
          <h3 className={`text-lg font-bold text-ink-900 transition-colors ${theme.hoverTitle}`}>
            {label}
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-500">
            {t(category.taglineKey)}
          </p>
        </div>

        {category.etaMinutes && (
          <div className="inline-flex items-center gap-1.5 rounded-lg bg-ink-50 px-3 py-1.5 text-xs font-semibold text-ink-600">
            <IconSiren className="h-3.5 w-3.5" />
            {t('home.category.emergencyEta', { minutes: category.etaMinutes })}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => navigate(`/report/${category.id}`)}
        className={`mt-6 flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-bold shadow-md transition-all duration-200 ${theme.button}`}
      >
        <span>{t('home.category.cta', { label })}</span>
        <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </button>
    </motion.div>
  )
}

function StatTile({ value, label, color }) {
  return (
    <div className="flex flex-col items-center px-4 first:pl-0 sm:items-start">
      <span className={`font-display text-2xl font-bold ${color}`}>{value}</span>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">
        {label}
      </span>
    </div>
  )
}

export default function Home() {
  const { user } = useAuth()
  const { reports, myReports, toggleUpvote } = useReports()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const firstName = user?.name?.split(' ')[0] ?? ''

  // Every stat here comes straight from the reports collection -- no
  // gamified points system exists in this app, so the dashboard never
  // shows a made-up number to make a citizen's activity look bigger than
  // it is.
  const myStats = useMemo(
    () => ({
      filed: myReports.length,
      resolved: myReports.filter((r) => r.status === 'resolved').length,
      upvotes: myReports.reduce((sum, r) => sum + (r.upvotes ?? 0), 0),
    }),
    [myReports]
  )

  const recentReports = useMemo(
    () =>
      [...myReports]
        .sort((a, b) => toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime())
        .slice(0, 3),
    [myReports]
  )

  const citywide = useMemo(() => {
    const resolved = reports.filter((r) => r.status === 'resolved')
    return {
      total: reports.length,
      resolved: resolved.length,
      resolutionRate: reports.length ? Math.round((resolved.length / reports.length) * 100) : 0,
    }
  }, [reports])

  return (
    <div className="min-h-screen bg-ink-50">
      <Navbar />
      <PageTransition>
        {/* Welcome + personal stats */}
        <section className="bg-white">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-xs font-bold uppercase tracking-widest text-brand-700">
                    {t('home.eyebrow')}
                  </span>
                  <span className="text-ink-300">•</span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-success-50 px-2.5 py-1 text-xs font-semibold text-success-700">
                    <IconShieldCheck className="h-3.5 w-3.5" />
                    {t('home.verified')}
                  </span>
                </div>
                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 font-display text-2xl font-bold text-ink-900 sm:text-4xl"
                >
                  {t('home.welcome', { name: firstName })}
                </motion.h1>
                <p className="mt-2 max-w-xl text-ink-500">{t('home.intro')}</p>
              </div>

              <div className="flex shrink-0 divide-x divide-ink-100 rounded-2xl border border-ink-200 bg-white p-4 shadow-card">
                <StatTile value={myStats.filed} label={t('home.stats.filed')} color="text-ink-900" />
                <StatTile
                  value={myStats.resolved}
                  label={t('home.stats.resolved')}
                  color="text-success-600"
                />
                <StatTile
                  value={myStats.upvotes}
                  label={t('home.stats.upvotes')}
                  color="text-brand-700"
                />
              </div>
            </div>

            <div className="mt-10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="h-6 w-1.5 rounded-full bg-accent-500" />
                <h2 className="font-display text-lg font-bold text-ink-900 sm:text-xl">
                  {t('home.subtitle')}
                </h2>
              </div>
              <span className="hidden text-xs text-ink-400 sm:inline">
                {t('home.report.hint')}
              </span>
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-3">
              {CATEGORIES.map((category, i) => (
                <ReportCategoryCard key={category.id} category={category} index={i} />
              ))}
            </div>
          </div>
        </section>

        {/* Recent activity + citywide snapshot */}
        <section className="bg-ink-50 py-12 sm:py-14">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-ink-400">
                  {t('home.recent.eyebrow')}
                </span>
                <h2 className="mt-1 font-display text-xl font-bold text-ink-900 sm:text-2xl">
                  {t('home.recent.title')}
                </h2>
              </div>
              {myReports.length > 0 && (
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline"
                >
                  {t('home.recent.viewAll', { count: myReports.length })}
                  <IconArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="grid gap-5 lg:grid-cols-12">
              <div className="flex flex-col gap-4 lg:col-span-7">
                {recentReports.length === 0 ? (
                  <EmptyState
                    icon={<IconListChecks className="h-6 w-6" />}
                    title={t('home.recent.empty.title')}
                    subtitle={t('home.recent.empty.subtitle')}
                  />
                ) : (
                  recentReports.map((report, i) => (
                    <ReportCard
                      key={report.id}
                      report={report}
                      index={i}
                      upvoted={user ? (report.upvotedBy ?? []).includes(user.uid) : false}
                      onUpvote={() => toggleUpvote(report.id)}
                    />
                  ))
                )}
              </div>

              <div className="flex flex-col gap-4 rounded-2xl border border-ink-200 bg-white p-5 shadow-card lg:col-span-5">
                <div className="flex items-center gap-2">
                  <IconSparkle className="h-5 w-5 text-accent-600" />
                  <h3 className="text-sm font-bold uppercase tracking-wide text-ink-900">
                    {t('home.snapshot.title')}
                  </h3>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-ink-50 p-3">
                    <p className="font-display text-xl font-bold text-brand-700">
                      {citywide.total.toLocaleString()}
                    </p>
                    <p className="mt-0.5 text-[11px] font-medium text-ink-500">
                      {t('data.totalReports')}
                    </p>
                  </div>
                  <div className="rounded-xl bg-ink-50 p-3">
                    <p className="font-display text-xl font-bold text-success-600">
                      {citywide.resolved.toLocaleString()}
                    </p>
                    <p className="mt-0.5 text-[11px] font-medium text-ink-500">
                      {t('data.resolvedReports')}
                    </p>
                  </div>
                  <div className="rounded-xl bg-ink-50 p-3">
                    <p className="font-display text-xl font-bold text-accent-600">
                      {citywide.resolutionRate}%
                    </p>
                    <p className="mt-0.5 text-[11px] font-medium text-ink-500">
                      {t('data.resolutionRate')}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/data')}
                  className="mt-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-ink-200 py-2.5 text-sm font-semibold text-ink-700 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                >
                  {t('home.snapshot.viewData')}
                  <IconArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Emergency helplines -- real, publicly known Indian government
            numbers (India's unified emergency number and the NHAI highway
            patrol line), shown as informational only. Never fabricate a
            contact channel this app doesn't actually operate. */}
        <section className="bg-brand-950 py-8 text-white">
          <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-center gap-3.5">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emergency-600">
                <IconPhone className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-brand-200">
                  {t('home.helplines.eyebrow')}
                </p>
                <p className="text-sm font-semibold text-white">{t('home.helplines.title')}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <a
                href="tel:1033"
                className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-2.5 transition-colors hover:bg-white/15"
              >
                <span className="text-xs uppercase text-brand-200">{t('home.helplines.nhai')}</span>
                <span className="font-display text-lg font-bold">1033</span>
              </a>
              <a
                href="tel:112"
                className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-2.5 transition-colors hover:bg-white/15"
              >
                <span className="text-xs uppercase text-brand-200">
                  {t('home.helplines.national')}
                </span>
                <span className="font-display text-lg font-bold">112</span>
              </a>
            </div>
          </div>
        </section>
      </PageTransition>
    </div>
  )
}

import { useMemo } from 'react'
import { useReports } from '../context/ReportsContext'
import { useLanguage } from '../context/LanguageContext'
import { CATEGORIES, STATUSES, normalizeCategoryId } from '../data/categoryTypes'
import { toDate } from '../lib/time'
import AdminLayout from '../components/AdminLayout'
import ReportMapSection from '../components/ReportMapSection'

const BAR_THEME = {
  brand: 'bg-brand-600',
  accent: 'bg-accent-500',
  emergency: 'bg-emergency-500',
  ink: 'bg-ink-400',
  warning: 'bg-warning-500',
  success: 'bg-success-500',
}

const DAYS_TO_SHOW = 14

/** Lightweight admin analytics -- built with plain divs (bar widths as
 * percentages) rather than a charting library, to avoid adding to the
 * bundle for a handful of bar charts (see vite.config.js's manualChunks
 * comment on why bundle size gets deliberate attention in this project). */
export default function AdminAnalytics() {
  const { reports } = useReports()
  const { t, lang } = useLanguage()


  const byCategory = useMemo(
    () =>
      CATEGORIES.map((c) => ({
        id: c.id,
        label: t(c.labelKey),
        theme: c.theme,
        count: reports.filter((r) => normalizeCategoryId(r.category) === c.id).length,
      })),
    [reports, t]
  )

  const byStatus = useMemo(
    () =>
      STATUSES.map((s) => ({
        id: s.id,
        label: t(s.labelKey),
        theme: s.theme,
        count: reports.filter((r) => r.status === s.id).length,
      })),
    [reports, t]
  )

  const avgResolutionHours = useMemo(() => {
    const resolved = reports.filter(
      (r) => r.status === 'resolved' && r.resolvedAt
    )
    if (resolved.length === 0) return null
    const totalMs = resolved.reduce(
      (sum, r) =>
        sum + (toDate(r.resolvedAt).getTime() - toDate(r.createdAt).getTime()),
      0
    )
    return totalMs / resolved.length / (1000 * 60 * 60)
  }, [reports])

  const topLocations = useMemo(() => {
    const counts = new Map()
    reports.forEach((r) => {
      const city = r.location?.city || r.location?.address
      if (!city) return
      counts.set(city, (counts.get(city) ?? 0) + 1)
    })
    return [...counts.entries()]
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [reports])

  const dailyCounts = useMemo(() => {
    const days = []
    for (let i = DAYS_TO_SHOW - 1; i >= 0; i--) {
      const date = new Date()
      date.setHours(0, 0, 0, 0)
      date.setDate(date.getDate() - i)
      days.push({ date, count: 0 })
    }
    reports.forEach((r) => {
      const created = toDate(r.createdAt)
      const day = days.find(
        (d) =>
          d.date.getFullYear() === created.getFullYear() &&
          d.date.getMonth() === created.getMonth() &&
          d.date.getDate() === created.getDate()
      )
      if (day) day.count += 1
    })
    return days
  }, [reports])

  const maxDailyCount = Math.max(...dailyCounts.map((d) => d.count), 1)
  const maxCategoryCount = Math.max(...byCategory.map((c) => c.count), 1)
  const maxStatusCount = Math.max(...byStatus.map((s) => s.count), 1)

  return (
    <AdminLayout>
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <h1 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl">
          {t('admin.analytics.title')}
        </h1>
        <p className="mt-1.5 text-ink-500">{t('admin.analytics.subtitle')}</p>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatTile label={t('admin.stats.total')} value={reports.length} />
          <StatTile
            label={t('admin.analytics.avgResolution')}
            value={
              avgResolutionHours == null
                ? '—'
                : `${avgResolutionHours.toFixed(1)}h`
            }
          />
          <StatTile
            label={t('admin.analytics.resolvedCount')}
            value={reports.filter((r) => r.status === 'resolved').length}
          />
        </div>

        <ReportMapSection reports={reports} />

        <section className="mt-8 rounded-2xl border border-ink-200 bg-white p-5 sm:p-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-ink-500">
            {t('admin.analytics.byDay')}
          </h2>
          <div className="mt-4 flex h-32 items-end gap-1.5">
            {dailyCounts.map((day, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-brand-600"
                  style={{
                    height: `${Math.max((day.count / maxDailyCount) * 100, day.count > 0 ? 6 : 2)}%`,
                  }}
                  title={`${day.count}`}
                />
                <span className="text-[9px] text-ink-400">
                  {day.date.toLocaleDateString(
                    lang === 'hi' ? 'hi-IN' : 'en-IN',
                    { day: 'numeric' }
                  )}
                </span>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <section className="rounded-2xl border border-ink-200 bg-white p-5 sm:p-6">
            <h2 className="text-sm font-bold uppercase tracking-wide text-ink-500">
              {t('admin.analytics.byCategory')}
            </h2>
            <div className="mt-4 space-y-3">
              {byCategory.map((c) => (
                <BarRow
                  key={c.id}
                  label={c.label}
                  count={c.count}
                  max={maxCategoryCount}
                  theme={c.theme}
                />
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-ink-200 bg-white p-5 sm:p-6">
            <h2 className="text-sm font-bold uppercase tracking-wide text-ink-500">
              {t('admin.analytics.byStatus')}
            </h2>
            <div className="mt-4 space-y-3">
              {byStatus.map((s) => (
                <BarRow
                  key={s.id}
                  label={s.label}
                  count={s.count}
                  max={maxStatusCount}
                  theme={s.theme}
                />
              ))}
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-2xl border border-ink-200 bg-white p-5 sm:p-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-ink-500">
            {t('admin.analytics.topLocations')}
          </h2>
          <div className="mt-4 space-y-2">
            {topLocations.length === 0 && (
              <p className="text-sm text-ink-400">
                {t('admin.analytics.noData')}
              </p>
            )}
            {topLocations.map((loc) => (
              <div
                key={loc.city}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="truncate text-ink-700">{loc.city}</span>
                <span className="shrink-0 font-semibold text-ink-900">
                  {loc.count}
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </AdminLayout>
  )
}

function StatTile({ label, value }) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-4">
      <p className="font-display text-2xl font-bold text-ink-900">{value}</p>
      <p className="text-xs text-ink-500">{label}</p>
    </div>
  )
}

function BarRow({ label, count, max, theme }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-ink-600">{label}</span>
        <span className="font-semibold text-ink-900">{count}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-ink-100">
        <div
          className={`h-full rounded-full ${BAR_THEME[theme] ?? 'bg-brand-600'}`}
          style={{ width: `${(count / max) * 100}%` }}
        />
      </div>
    </div>
  )
}

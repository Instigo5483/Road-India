import { useMemo } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useReports } from '../context/ReportsContext'
import { useLanguage } from '../context/LanguageContext'
import LanguageSelector from '../components/LanguageSelector'
import Button from '../components/Button'
import Logo from '../components/Logo'
import CategoryIcon from '../components/CategoryIcon'
import { CATEGORIES } from '../data/categoryTypes'
import {
  IconArrowRight,
  IconMapPin,
  IconCamera,
  IconCheckCircle,
} from '../components/Icons'

const HOW_STEPS = [
  {
    icon: IconMapPin,
    titleKey: 'landing.how.step1.title',
    bodyKey: 'landing.how.step1.body',
    badge: 'bg-accent-500/10 text-accent-600',
  },
  {
    icon: IconCamera,
    titleKey: 'landing.how.step2.title',
    bodyKey: 'landing.how.step2.body',
    badge: 'bg-brand-600/10 text-brand-700',
  },
  {
    icon: IconCheckCircle,
    titleKey: 'landing.how.step3.title',
    bodyKey: 'landing.how.step3.body',
    badge: 'bg-success-500/10 text-success-600',
  },
]

const STAT_COLORS = {
  reported: 'text-brand-600',
  resolved: 'text-success-600',
  cities: 'text-accent-600',
}

const CATEGORY_CTA = {
  accent: 'text-accent-700',
  brand: 'text-brand-700',
  emergency: 'text-emergency-700',
}

export default function Landing() {
  const { user, loading } = useAuth()
  const { reports } = useReports()
  const { t } = useLanguage()
  const navigate = useNavigate()

  // Real counts from the reports collection (publicly readable, see
  // firestore.rules) -- no login required to compute these, so the
  // landing page never shows made-up numbers.
  const stats = useMemo(() => {
    const cities = new Set(reports.map((r) => r.location?.city).filter(Boolean))
    return [
      {
        key: 'landing.stats.reported',
        value: reports.length,
        color: STAT_COLORS.reported,
      },
      {
        key: 'landing.stats.resolved',
        value: reports.filter((r) => r.status === 'resolved').length,
        color: STAT_COLORS.resolved,
      },
      {
        key: 'landing.stats.cities',
        value: cities.size,
        color: STAT_COLORS.cities,
      },
    ]
  }, [reports])

  if (!loading && user) return <Navigate to="/home" replace />

  return (
    <div className="min-h-screen bg-white text-ink-900">
      <header className="sticky top-0 z-20 border-b border-ink-200 bg-white/95 shadow-card backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-brand-900">
            <Logo className="h-9 w-9" />
            {t('common.appName')}
          </div>

          <nav className="hidden items-center gap-7 text-sm font-medium text-ink-600 md:flex">
            <a
              href="#how-it-works"
              className="transition-colors hover:text-brand-700"
            >
              {t('landing.nav.howItWorks')}
            </a>
            <a
              href="#categories"
              className="transition-colors hover:text-brand-700"
            >
              {t('landing.nav.categories')}
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            <LanguageSelector variant="neutral" />
            <Button
              size="sm"
              variant="secondary"
              onClick={() => navigate('/login')}
            >
              {t('landing.nav.login')}
            </Button>
          </div>
        </div>
      </header>

      <main className="bg-gradient-to-b from-brand-50/70 via-white to-white">
        <section className="mx-auto max-w-4xl px-4 pb-16 pt-16 text-center sm:px-6 sm:pt-24">
          <motion.span
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="eyebrow-pill bg-brand-600/10 text-brand-700"
          >
            {t('landing.hero.eyebrow')}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mt-5 font-display text-3xl font-bold leading-tight text-ink-900 sm:text-5xl"
          >
            {t('landing.hero.title')}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="mx-auto mt-4 max-w-xl text-base text-ink-500 sm:text-lg"
          >
            {t('landing.hero.subtitle')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24 }}
            className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Button size="lg" onClick={() => navigate('/login')}>
              {t('landing.cta.login')}
              <IconArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="secondary" href="#how-it-works">
              {t('landing.nav.howItWorks')}
            </Button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-4 text-xs font-medium text-ink-400"
          >
            {t('landing.hero.trust')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="mx-auto mt-14 grid max-w-lg grid-cols-3 gap-4 border-t border-ink-200 pt-8"
          >
            {stats.map((stat) => (
              <div key={stat.key}>
                <p
                  className={`font-display text-2xl font-bold sm:text-4xl ${stat.color}`}
                >
                  {stat.value.toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-ink-500 sm:text-sm">
                  {t(stat.key)}
                </p>
              </div>
            ))}
          </motion.div>
        </section>

        <section
          id="how-it-works"
          className="border-t border-ink-100 bg-white py-16 sm:py-20"
        >
          <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
            <span className="eyebrow-pill bg-accent-500/10 text-accent-600">
              {t('landing.how.eyebrow')}
            </span>
            <h2 className="mt-4 font-display text-2xl font-bold text-ink-900 sm:text-3xl">
              {t('landing.how.title')}
            </h2>

            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              {HOW_STEPS.map((step, i) => (
                <motion.div
                  key={step.titleKey}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className="rounded-2xl border border-ink-200 bg-white p-8 text-center"
                >
                  <span
                    className={`mx-auto grid h-14 w-14 place-items-center rounded-xl ${step.badge}`}
                  >
                    <step.icon className="h-6.5 w-6.5" />
                  </span>
                  <h3 className="mt-4 font-bold text-ink-900">
                    {t(step.titleKey)}
                  </h3>
                  <p className="mt-1.5 text-sm text-ink-500">
                    {t(step.bodyKey)}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="categories"
          className="border-t border-ink-100 bg-ink-50 py-16 sm:py-20"
        >
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
              {CATEGORIES.map((category, i) => {
                return (
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
                        <CategoryIcon
                          category={category.id}
                          className="h-14 w-14"
                        />
                      </div>
                      <h3 className="mt-4 text-lg font-bold text-ink-900">
                        {t(category.labelKey)}
                      </h3>
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
                )
              })}
            </div>
          </div>
        </section>

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

      <footer className="border-t border-ink-100 bg-white py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 text-center sm:px-6">
          <div className="flex items-center gap-2 text-sm font-extrabold tracking-tight text-brand-900">
            <Logo className="h-7 w-7" />
            {t('common.appName')}
          </div>
          <p className="text-xs text-ink-400">{t('landing.footer.builtFor')}</p>
        </div>
      </footer>
    </div>
  )
}

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import PageTransition from '../components/PageTransition'
import ReportCard from '../components/ReportCard'
import EmptyState from '../components/EmptyState'
import Button from '../components/Button'
import { useReports } from '../context/ReportsContext'
import { useLanguage } from '../context/LanguageContext'
import { STATUSES } from '../data/categoryTypes'
import { IconMapPin } from '../components/Icons'

export default function Dashboard() {
  const { myReports, loading } = useReports()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return myReports
    return myReports.filter((r) => r.status === statusFilter)
  }, [myReports, statusFilter])

  const chips = [{ id: 'all', labelKey: 'dashboard.filter.all' }, ...STATUSES]

  return (
    <div className="min-h-screen bg-ink-50">
      <Navbar />
      <PageTransition className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <h1 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl">
          {t('dashboard.title')}
        </h1>
        <p className="mt-1.5 text-ink-500">{t('dashboard.subtitle')}</p>

        {myReports.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {chips.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => setStatusFilter(chip.id)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  statusFilter === chip.id
                    ? 'bg-brand-800 text-white'
                    : 'bg-white text-ink-600 hover:bg-ink-100'
                } border border-ink-200`}
              >
                {t(chip.labelKey)}
              </button>
            ))}
          </div>
        )}

        <div className="mt-6 space-y-3">
          {!loading && myReports.length === 0 && (
            <EmptyState
              icon={<IconMapPin className="h-6 w-6" />}
              title={t('dashboard.empty.title')}
              subtitle={t('dashboard.empty.subtitle')}
              action={
                <Button onClick={() => navigate('/home')}>
                  {t('dashboard.empty.cta')}
                </Button>
              }
            />
          )}

          {filtered.map((report, i) => (
            <ReportCard
              key={report.id}
              report={report}
              index={i}
              showUpvote={false}
            />
          ))}

          {!loading && myReports.length > 0 && filtered.length === 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-10 text-center text-sm text-ink-400"
            >
              {t('reports.empty')}
            </motion.p>
          )}
        </div>
      </PageTransition>
    </div>
  )
}

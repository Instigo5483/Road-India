import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'
import PageTransition from '../components/PageTransition'
import CategoryCard from '../components/CategoryCard'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { CATEGORIES } from '../data/categoryTypes'
import { IconAlertCircle } from '../components/Icons'

export default function Home() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const firstName = user?.name?.split(' ')[0] ?? ''

  return (
    <div className="min-h-screen bg-ink-50">
      <Navbar />
      <PageTransition className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-2xl font-bold text-ink-900 sm:text-3xl"
        >
          {t('home.welcome', { name: firstName })}
        </motion.h1>
        <p className="mt-1.5 text-ink-500">{t('home.subtitle')}</p>

        <div className="mt-4 flex items-center gap-2 rounded-xl border border-emergency-200 bg-emergency-50 px-4 py-3 text-sm font-medium text-emergency-700">
          <IconAlertCircle className="h-4 w-4 shrink-0" />
          {t('home.emergencyBanner')}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((category, i) => (
            <CategoryCard key={category.id} category={category} index={i} />
          ))}
        </div>
      </PageTransition>
    </div>
  )
}

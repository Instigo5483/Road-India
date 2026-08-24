import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { IconPothole, IconSignpost, IconSiren, IconArrowRight } from './Icons'

const ICONS = { pothole: IconPothole, signpost: IconSignpost, siren: IconSiren }

const THEME_STYLES = {
  accent: {
    ring: 'group-hover:ring-accent-300',
    iconBg: 'bg-accent-500/10 text-accent-600',
    glow: 'from-accent-100/70',
    cta: 'text-accent-700',
  },
  brand: {
    ring: 'group-hover:ring-brand-300',
    iconBg: 'bg-brand-600/10 text-brand-700',
    glow: 'from-brand-100/70',
    cta: 'text-brand-700',
  },
  emergency: {
    ring: 'group-hover:ring-emergency-300',
    iconBg: 'bg-emergency-500/10 text-emergency-600',
    glow: 'from-emergency-100/70',
    cta: 'text-emergency-700',
  },
}

export default function CategoryCard({ category, index = 0 }) {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const Icon = ICONS[category.icon]
  const theme = THEME_STYLES[category.theme]

  return (
    <motion.button
      type="button"
      onClick={() => navigate(`/report/${category.id}`)}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4, ease: 'easeOut' }}
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.98 }}
      className={`group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-ink-200 bg-white p-8 text-left ring-1 ring-transparent transition-shadow duration-300 hover:shadow-card-hover ${theme.ring}`}
    >
      <div
        className={`pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br ${theme.glow} to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
      />

      <div className="relative">
        <span
          className={`grid h-14 w-14 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 ${theme.iconBg}`}
        >
          {Icon && <Icon className="h-6.5 w-6.5" />}
        </span>
        <h3 className="mt-4 text-lg font-bold text-ink-900">{t(category.labelKey)}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{t(category.taglineKey)}</p>
      </div>

      <div className={`relative mt-6 flex items-center gap-1.5 text-sm font-semibold ${theme.cta}`}>
        <span>Report now</span>
        <IconArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
      </div>
    </motion.button>
  )
}

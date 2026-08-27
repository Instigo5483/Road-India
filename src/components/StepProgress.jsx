import { motion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { IconCheck } from './Icons'

export default function StepProgress({ step }) {
  const { t } = useLanguage()
  const steps = [
    { id: 1, key: 'report.step.details' },
    { id: 2, key: 'report.step.location' },
  ]

  return (
    <div className="flex items-center gap-3">
      {steps.map((s, i) => (
        <div key={s.id} className="flex flex-1 items-center gap-3">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{
                backgroundColor: step >= s.id ? '#1e40af' : '#e2e8f0',
                color: step >= s.id ? '#ffffff' : '#94a3b8',
              }}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold"
            >
              {step > s.id ? <IconCheck className="h-4 w-4" /> : s.id}
            </motion.div>
            <span
              className={`text-sm font-medium ${step >= s.id ? 'text-ink-800' : 'text-ink-400'}`}
            >
              {t(s.key)}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className="h-0.5 flex-1 overflow-hidden rounded-full bg-ink-100">
              <motion.div
                className="h-full bg-brand-800"
                initial={false}
                animate={{ width: step > s.id ? '100%' : '0%' }}
                transition={{ duration: 0.3 }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

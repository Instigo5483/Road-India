import { motion } from 'framer-motion'

export default function EmptyState({ icon, title, subtitle, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-ink-200 bg-white/60 px-6 py-14 text-center"
    >
      {icon && (
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-ink-100 text-ink-400">
          {icon}
        </span>
      )}
      <h3 className="text-base font-bold text-ink-800">{title}</h3>
      {subtitle && <p className="max-w-xs text-sm text-ink-500">{subtitle}</p>}
      {action && <div className="mt-2">{action}</div>}
    </motion.div>
  )
}

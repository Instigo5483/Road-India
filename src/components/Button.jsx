import { motion } from 'framer-motion'
import { IconLoader } from './Icons'

const variants = {
  // High-emphasis call-to-action -- orange, matching the reference
  // design system's primary "Start Free Trial"-style button treatment.
  primary:
    'bg-accent-500 text-white shadow-card hover:bg-accent-600 disabled:bg-ink-200 disabled:text-ink-400',
  secondary:
    'bg-white text-brand-600 border border-ink-200 hover:border-brand-300 hover:bg-brand-50 disabled:text-ink-300',
  ghost: 'bg-transparent text-ink-600 hover:bg-ink-100 disabled:text-ink-300',
  danger:
    'bg-emergency-600 text-white shadow-card hover:bg-emergency-700 disabled:bg-ink-200 disabled:text-ink-400',
}

const sizes = {
  md: 'h-11 px-5 text-[15px]',
  lg: 'h-14 px-7 text-base',
  sm: 'h-9 px-3.5 text-sm',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  icon,
  type = 'button',
  href,
  ...props
}) {
  const isDisabled = disabled || loading
  const Tag = href ? motion.a : motion.button
  const tagProps = href ? { href } : { type, disabled: isDisabled }

  return (
    <Tag
      {...tagProps}
      whileHover={isDisabled ? {} : { scale: 1.02, y: -1 }}
      whileTap={isDisabled ? {} : { scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors duration-150 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? <IconLoader className="h-4 w-4" /> : icon}
      {children}
    </Tag>
  )
}

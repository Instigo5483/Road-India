import { IconLoader } from './Icons'

export default function LoadingScreen() {
  return (
    <div className="grid min-h-screen place-items-center bg-ink-50 dark:bg-ink-950">
      <div className="flex flex-col items-center gap-3 text-brand-700">
        <IconLoader className="h-7 w-7" />
        <span className="text-sm font-medium text-ink-400 dark:text-ink-500">Loading Road India…</span>
      </div>
    </div>
  )
}

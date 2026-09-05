import { useRef, useState } from 'react'
import { useAuth, useLanguage, useReports } from '../context/useAppContext'
import { reactionCounts } from '../lib/resolutionReactions'

export default function ResolutionReactions({ report }) {
  const { user } = useAuth()
  const { lang } = useLanguage()
  const { reactToResolution } = useReports()
  const pending = useRef(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const say = (en, hi) => lang === 'hi' ? hi : en
  if (report.status !== 'resolved') return null
  const counts = reactionCounts(report)
  const selected = report.resolutionReactions?.[user?.uid]
  async function react(value) {
    if (!user || pending.current) return
    pending.current = true
    setBusy(true)
    setError('')
    try { await reactToResolution(report.id, value) }
    catch { setError(say('Could not save your reaction. Please retry.', 'आपकी प्रतिक्रिया सहेजी नहीं जा सकी। फिर प्रयास करें।')) }
    finally { pending.current = false; setBusy(false) }
  }
  return <section onClick={event => event.stopPropagation()} onKeyDown={event => { if (event.key !== 'Tab' && event.key !== 'Escape') event.stopPropagation() }} className="mt-3 rounded-xl border border-ink-200 bg-ink-50 p-3" aria-label={say('Community resolution check', 'समुदाय समाधान जाँच')}>
    <h3 className="text-sm font-bold text-ink-900">{say('Is this really resolved?', 'क्या यह वास्तव में हल हुआ है?')}</h3>
    <p className="mt-1 text-xs leading-relaxed text-ink-500">{say('Community opinion—not verified proof or the reporter’s review.', 'समुदाय की राय—सत्यापित प्रमाण या रिपोर्टकर्ता की समीक्षा नहीं।')}</p>
    <div className="mt-3 grid grid-cols-2 gap-2" aria-busy={busy}>
      {['true', 'false'].map(value => <button key={value} type="button" disabled={!user || busy} aria-pressed={selected === value} onClick={() => react(value)} className={`min-h-11 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors disabled:opacity-60 ${selected === value ? (value === 'true' ? 'border-green-600 bg-green-100 text-green-900' : 'border-red-600 bg-red-100 text-red-900') : 'border-ink-200 bg-white text-ink-700 hover:bg-ink-100'}`}>
        {value === 'true' ? say('True', 'सही') : say('False', 'गलत')} · {counts[value]}
      </button>)}
    </div>
    <p className="mt-2 text-xs text-ink-500" role="status">{busy ? say('Saving…', 'सहेज रहे हैं…') : !user ? say('Sign in as a citizen to react.', 'प्रतिक्रिया के लिए नागरिक के रूप में साइन इन करें।') : say('One vote per account. Tap your selected vote to remove it.', 'प्रति खाते एक मत। अपना चयन दोबारा दबाकर हटाएँ।')}</p>
    {error && <p role="alert" className="mt-2 text-xs text-red-700">{error}</p>}
  </section>
}

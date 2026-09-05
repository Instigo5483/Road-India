import { useLanguage } from '../context/LanguageContext'
import { formatTimestamp } from '../lib/time'

export default function ResolutionProof({ proof }) {
  const { lang } = useLanguage()
  if (!proof) return null
  const say = (en, hi) => lang === 'hi' ? hi : en
  return <section className="space-y-3 rounded-xl border border-sky-100 bg-sky-50/50 p-4">
    <h3 className="text-sm font-bold text-sky-900">{say('Resolution proof', 'समाधान का प्रमाण')}</h3>
    {proof.photoUrls?.map((src, i) => <a key={i} href={src} target="_blank" rel="noreferrer" aria-label={say('Open repair photo', 'मरम्मत की फ़ोटो खोलें')}><img src={src} alt={say('Administrator-submitted after-repair evidence', 'व्यवस्थापक द्वारा दी गई मरम्मत के बाद की फ़ोटो')} className="max-h-64 w-full rounded-lg object-contain" loading="lazy" /></a>)}
    <p className="whitespace-pre-wrap break-words text-sm text-ink-700">{proof.notes}</p>
    <p className="break-words text-xs text-ink-500">{say('Submitted by', 'जमा करने वाले')}: {proof.officer} · {formatTimestamp(proof.submittedAt)}</p>
    {proof.workOrder && <p className="break-words text-xs text-ink-500">{say('Work order', 'कार्य आदेश')}: {proof.workOrder}</p>}
    <p className="text-xs text-ink-500">{say('Administrator-submitted evidence. Not independently verified by AI or a government agency.', 'व्यवस्थापक द्वारा दिया गया प्रमाण। AI या सरकारी एजेंसी से स्वतंत्र सत्यापन नहीं हुआ है।')}</p>
  </section>
}

import { useState } from 'react'
import { useReports } from '../context/ReportsContext'
import { useLanguage } from '../context/LanguageContext'
import { useToast } from '../context/ToastContext'
import PhotoUpload from './PhotoUpload'
import ResolutionProof from './ResolutionProof'
import { IconX, IconShieldCheck } from './Icons'

export default function AdminResolutionPanel({ report, onClose, onDetails }) {
  const { lang } = useLanguage()
  const { resolveWithProof } = useReports()
  const { showToast } = useToast()
  const say = (en, hi) => lang === 'hi' ? hi : en
  const key = `road_india_resolution_draft_${report.id}`
  const [draft] = useState(() => { try { return JSON.parse(sessionStorage.getItem(key)) || {} } catch { return {} } })
  const [photos, setPhotos] = useState(draft.photos || [])
  const [officer, setOfficer] = useState(draft.officer || '')
  const [workOrder, setWorkOrder] = useState(draft.workOrder || '')
  const [notes, setNotes] = useState(draft.notes || '')
  const [certified, setCertified] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  function saveDraft() {
    try { sessionStorage.setItem(key, JSON.stringify({ photos, officer, workOrder, notes })); showToast(say('Draft saved in this tab.', 'ड्राफ्ट इसी टैब में सहेजा गया।')) }
    catch { setError(say('Not enough browser storage to save this draft.', 'ड्राफ्ट सहेजने के लिए पर्याप्त स्टोरेज नहीं है।')) }
  }
  async function submit(event) {
    event.preventDefault()
    setBusy(true); setError('')
    try {
      await resolveWithProof(report.id, { photoUrls: photos.map(p => p.src), officer: officer.trim(), workOrder: workOrder.trim(), notes: notes.trim(), certified })
      try { sessionStorage.removeItem(key) } catch { /* Saved proof is already in the database. */ }
      showToast(say('Proof saved. Report marked resolved.', 'प्रमाण सहेजा गया। रिपोर्ट हल चिह्नित हुई।'))
    } catch (e) { setError(say('Could not resolve report. Check photo size, connection and database permissions. ', 'रिपोर्ट हल नहीं हुई। फ़ोटो आकार, कनेक्शन और डेटाबेस अनुमति जाँचें। ') + (e.code || '')) }
    finally { setBusy(false) }
  }
  return <section className="overflow-hidden rounded-2xl bg-white shadow-card-hover">
    <div className="flex items-start justify-between gap-3 bg-ink-100 p-5"><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-widest text-orange-800">{say('Resolution verification', 'समाधान सत्यापन')}</p><h2 className="mt-2 break-words font-display text-xl font-bold">{say(report.status === 'resolved' ? 'Resolution record' : 'Resolve report', report.status === 'resolved' ? 'समाधान रिकॉर्ड' : 'रिपोर्ट हल करें')}</h2><p className="mt-1 break-all font-mono text-xs text-ink-500">#{report.id}</p></div><button type="button" disabled={busy} onClick={onClose} aria-label={say('Close panel', 'पैनल बंद करें')} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white"><IconX className="h-4 w-4" /></button></div>
    <div className="bg-orange-50 px-5 py-3 text-xs leading-relaxed text-orange-900">{say('Attach repair evidence and a sign-off before closing this report. Evidence is public; do not upload private IDs. Photos are not automatically geo-verified.', 'रिपोर्ट बंद करने से पहले मरम्मत का प्रमाण और पुष्टि दें। प्रमाण सार्वजनिक है; निजी पहचान न डालें। फ़ोटो का भू-सत्यापन स्वचालित नहीं है।')}</div>
    <div className="space-y-5 p-5"><button type="button" onClick={onDetails} className="flex w-full items-center gap-3 rounded-xl bg-ink-50 p-3 text-left">{report.photoUrls?.[0] && <img src={report.photoUrls[0]} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />}<span className="min-w-0"><span className="block text-[10px] uppercase text-ink-400">{say('Original issue · View details', 'मूल समस्या · विवरण देखें')}</span><span className="mt-1 line-clamp-2 block text-sm font-semibold">{report.description}</span><span className="mt-1 line-clamp-2 block text-xs text-ink-500">{report.location?.address}</span></span></button>
      {report.status === 'resolved' ? (report.resolutionProof ? <ResolutionProof proof={report.resolutionProof} /> : <p className="text-sm text-ink-500">{say('This earlier resolution has no uploaded proof.', 'इस पुराने समाधान का प्रमाण अपलोड नहीं है।')}</p>) : <form onSubmit={submit} className="space-y-4">
        <div className="rounded-xl border-2 border-dashed border-ink-200 bg-ink-50 p-4"><p className="mb-3 text-sm font-bold">{say('Upload after-repair proof *', 'मरम्मत के बाद का प्रमाण अपलोड करें *')}</p><PhotoUpload photos={photos} onChange={setPhotos} maxPhotos={1} /><p className="mt-3 text-[11px] leading-relaxed text-ink-500">{say('One image, compressed for database storage. Video is not supported. Save Draft before switching reports.', 'डेटाबेस के लिए संपीड़ित एक फ़ोटो। वीडियो समर्थित नहीं है। रिपोर्ट बदलने से पहले ड्राफ्ट सहेजें।')}</p></div>
        <label className="block text-xs font-semibold">{say('Inspection officer / display name *', 'निरीक्षण अधिकारी / प्रदर्शन नाम *')}<input required maxLength={100} value={officer} onChange={e => setOfficer(e.target.value)} className="input-field mt-2 w-full" /></label>
        <label className="block text-xs font-semibold">{say('Contractor / work order reference', 'ठेकेदार / कार्य आदेश संदर्भ')}<input maxLength={150} value={workOrder} onChange={e => setWorkOrder(e.target.value)} className="input-field mt-2 w-full" /></label>
        <label className="block text-xs font-semibold">{say('Resolution notes & materials used *', 'समाधान विवरण और उपयोग की गई सामग्री *')}<textarea required maxLength={2000} rows={4} value={notes} onChange={e => setNotes(e.target.value)} className="input-field mt-2 w-full" /></label>
        <label className="flex items-start gap-3 text-xs leading-relaxed text-ink-600"><input type="checkbox" required checked={certified} onChange={e => setCertified(e.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-orange-500" />{say('I confirm that these notes and photos accurately describe the completed work.', 'मैं पुष्टि करता हूँ कि ये विवरण और फ़ोटो पूर्ण किए गए कार्य का सही वर्णन करते हैं।')}</label>
        {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
        <div className="flex flex-wrap gap-2"><button type="button" disabled={busy} onClick={saveDraft} className="min-h-11 rounded-lg bg-ink-100 px-4 text-xs font-semibold">{say('Save Draft', 'ड्राफ्ट सहेजें')}</button><button type="submit" disabled={busy || !photos.length || !officer.trim() || !notes.trim() || !certified} className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-accent-500 px-3 py-2 text-xs font-bold text-white disabled:opacity-40"><IconShieldCheck className="h-4 w-4 shrink-0" />{busy ? say('Saving…', 'सहेज रहे हैं…') : say('Submit Proof & Mark Resolved', 'प्रमाण जमा करें और हल चिह्नित करें')}</button></div>
      </form>}
    </div>
  </section>
}

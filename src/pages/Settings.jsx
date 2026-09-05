import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageTransition from '../components/PageTransition'
import MobileBottomNav from '../components/MobileBottomNav'
import LanguageSelector from '../components/LanguageSelector'
import UserMenu from '../components/UserMenu'
import Logo from '../components/Logo'
import PublicNameSelect from '../components/PublicNameSelect'
import { StarRatingInput } from '../components/StarRating'
import { useAuth } from '../context/AuthContext'
import { useReports } from '../context/ReportsContext'
import { useLanguage } from '../context/LanguageContext'
import { useToast } from '../context/ToastContext'
import { computeCivicPoints } from '../lib/civicPoints'
import { maskAadhaarId } from '../lib/format'
import { DEFAULT_PREFERENCES, publicName, draftKey, historyKey, readLocal, downloadJson } from '../lib/preferences'
import { IconChevronLeft, IconShieldCheck, IconAward, IconSettings, IconArrowRight, IconLogOut, IconCheck } from '../components/Icons'

const REPO = 'https://github.com/Instigo5483/Road-India'
const card = 'rounded-xl bg-white p-4 shadow-card sm:p-6'
function Toggle({ label, description, value, onChange }) {
  return <div className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
    <div className="min-w-0"><p className="text-sm font-semibold text-ink-900">{label}</p><p className="mt-1 text-xs leading-relaxed text-ink-500">{description}</p></div>
    <button type="button" role="switch" aria-label={label} aria-checked={value} onClick={() => onChange(!value)} className="flex h-11 w-12 shrink-0 items-center focus-visible:outline focus-visible:outline-accent-500">
      <span className={'flex h-7 w-12 items-center rounded-full p-0.5 transition-colors ' + (value ? 'bg-accent-500' : 'bg-ink-200')}><span className={'h-6 w-6 rounded-full bg-white shadow transition-transform ' + (value ? 'translate-x-5' : '')} /></span>
    </button>
  </div>
}
function Section({ title, description, children, color = 'bg-accent-500' }) {
  return <section className="mt-8 space-y-3"><h2 className="flex items-center gap-2 font-display text-xl font-bold tracking-tight text-ink-900"><span className={'h-5 w-1.5 shrink-0 rounded-full ' + color} />{title}</h2>{description && <p className="text-sm leading-relaxed text-ink-500">{description}</p>}{children}</section>
}
export default function Settings() {
  const { user, savePreferences, logout } = useAuth()
  const { myReports } = useReports()
  const { lang, t } = useLanguage()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const say = (en, hi) => lang === 'hi' ? hi : en
  const [preferences, setPreferences] = useState(() => ({ ...DEFAULT_PREFERENCES, ...user?.preferences }))
  const [busy, setBusy] = useState(false)
  const [bug, setBug] = useState(false)
  const [bugText, setBugText] = useState('')
  const cacheSize = () => [draftKey(user.uid), historyKey(user.uid)].reduce((n, key) => n + new Blob([JSON.stringify(readLocal(key, ''))]).size, 0)
  const [cacheBytes, setCacheBytes] = useState(cacheSize)
  const set = (key, value) => setPreferences(p => ({ ...p, [key]: value }))
  const initials = user.name?.trim().split(/\s+/).slice(0, 2).map(n => n[0]).join('')
  async function save() {
    setBusy(true)
    try {
      await savePreferences(preferences, lang)
      if (!preferences.offlineDrafts) localStorage.removeItem(draftKey(user.uid))
      if (!preferences.geoHistory) localStorage.removeItem(historyKey(user.uid))
      setCacheBytes(cacheSize())
      showToast(say('Preferences saved.', 'प्राथमिकताएँ सहेजी गईं।'))
    } catch {
      showToast(say('Could not save all preferences. Check connection and database permissions, then retry.', 'सेटिंग्स सहेजी नहीं गईं। कनेक्शन और डेटाबेस अनुमति जाँचकर फिर प्रयास करें।'), 'error')
    } finally { setBusy(false) }
  }
  function clearCache() {
    if (!window.confirm(say('Delete your local draft and location history? Submitted reports and your account will remain.', 'स्थानीय ड्राफ्ट और स्थान इतिहास हटाएँ? दर्ज रिपोर्ट और खाता सुरक्षित रहेंगे।'))) return
    try {
      localStorage.removeItem(draftKey(user.uid))
      localStorage.removeItem(historyKey(user.uid))
      setCacheBytes(0)
      showToast(say('Local drafts and history cleared.', 'स्थानीय ड्राफ्ट और इतिहास साफ किए गए।'))
    } catch { showToast(say('Browser storage is unavailable.', 'ब्राउज़र स्टोरेज उपलब्ध नहीं है।'), 'error') }
  }
  function exportData() {
    downloadJson('road-india-my-data.json', {
      exportedAt: new Date().toISOString(),
      account: { name: user.name, maskedId: maskAadhaarId(user.digilockerId), preferredLanguage: user.preferredLanguage, preferences: user.preferences, createdAt: user.createdAt },
      reports: myReports.map(report => { const copy = { ...report }; delete copy.upvotedBy; delete copy.createdBy; return copy }),
      draft: readLocal(draftKey(user.uid)), locationHistory: readLocal(historyKey(user.uid), []),
    })
  }
  const options = [
    ['first_initial', say('First Name & Initial · Recommended', 'पहला नाम और उपनाम का अक्षर · अनुशंसित')],
    ['anonymous', say('Anonymous Citizen', 'अनाम नागरिक')],
    ['legal_name', say('Full Account Name', 'पूरा खाता नाम')],
  ]
  const toggles = [
    ['showBadge', say('Display Citizen Account Badge','नागरिक खाता बैज दिखाएँ'), say('Show an account badge in report details. This is not government verification.','रिपोर्ट विवरण में खाता बैज दिखाएँ। यह सरकारी सत्यापन नहीं है।')],
    ['showRank', say('Show Civic Points','नागरिक अंक दिखाएँ'), say('Display your monthly contribution score in public report details.','सार्वजनिक रिपोर्ट विवरण में मासिक योगदान अंक दिखाएँ।')],
    ['offlineDrafts', say('Save Report Drafts Offline','रिपोर्ट ड्राफ्ट ऑफ़लाइन सहेजें'), say('Restore unfinished text, photos and location when reopening this form on this device.','इसी डिवाइस पर फ़ॉर्म दोबारा खोलने पर अधूरा विवरण, फ़ोटो और स्थान वापस पाएँ।')],
    ['compressPhotos', say('Auto-Compress Uploaded Photos','अपलोड फ़ोटो संपीड़ित करें'), say('Use smaller images to save bandwidth. When off, photos must still fit the database size limit.','डेटा बचाने के लिए छोटी फ़ोटो उपयोग करें। बंद होने पर भी फ़ोटो डेटाबेस सीमा में होनी चाहिए।')],
    ['geoHistory', say('Precise Location History','सटीक स्थान इतिहास'), say('Remember up to 20 submitted report locations on this device. No background tracking. Off by default.','20 जमा रिपोर्ट के स्थान इसी डिवाइस पर याद रखें। पृष्ठभूमि ट्रैकिंग नहीं। डिफ़ॉल्ट रूप से बंद।')],
  ]
  const faqs = [
    [say('How are reports resolved?','रिपोर्ट कैसे हल होती हैं?'), say('Administrators review reports and update their status. This website does not automatically penalize contractors or guarantee government response times.','व्यवस्थापक रिपोर्ट की समीक्षा करके स्थिति बदलते हैं। वेबसाइट ठेकेदारों पर स्वचालित जुर्माना या सरकारी समय सीमा की गारंटी नहीं देती।')],
    [say('Can I edit or withdraw a report?','क्या मैं रिपोर्ट बदल या वापस ले सकता हूँ?'), say('In My Reports, choose Edit while a report is Submitted or In Review. Withdrawal is not available. After resolution, confirm the result and leave a review.','दर्ज या समीक्षा वाली रिपोर्ट में संपादन चुनें। वापस लेने का विकल्प उपलब्ध नहीं है। समाधान के बाद पुष्टि और समीक्षा दें।')],
    [say('Do offline drafts submit automatically?','क्या ऑफ़लाइन ड्राफ्ट अपने आप जमा होते हैं?'), say('No. Drafts stay on this device. Reopen the form and submit when online. Loading the website itself still needs a connection.','नहीं। ड्राफ्ट इसी डिवाइस पर रहते हैं। ऑनलाइन होने पर फ़ॉर्म खोलकर जमा करें। वेबसाइट लोड करने के लिए इंटरनेट चाहिए।')],
  ]
  return <div className="min-h-screen bg-[#f8f9fa] pb-20 lg:pb-0">
    <header className="sticky top-0 z-50 border-b border-ink-100 bg-white/95 backdrop-blur-xl"><div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-3 sm:px-6">
      <div className="flex min-w-0 items-center gap-1"><button type="button" aria-label={t('nav.home')} onClick={() => navigate('/home')} className="grid h-11 w-9 shrink-0 place-items-center"><IconChevronLeft className="h-5 w-5" /></button><Logo className="h-7 w-7 shrink-0" /><span className="ml-1 hidden font-display text-lg font-bold min-[380px]:inline">{t('settings.title')}</span></div>
      <div className="flex shrink-0 items-center gap-1"><LanguageSelector variant="neutral" /><UserMenu /></div>
    </div></header>
    <PageTransition className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <p className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-ink-500"><IconSettings className="h-4 w-4" />{say('Account governance','खाता प्रबंधन')}</p>
      <h1 className="mt-2 font-display text-3xl font-bold text-ink-900">{t('settings.title')}</h1>
      <p className="mt-2 text-sm text-ink-500">{say('Preferences, privacy & civic account controls','प्राथमिकताएँ, गोपनीयता और नागरिक खाता नियंत्रण')}</p>
      <div className={card + ' mt-5'}>
        <div className="flex items-start gap-4"><div className="relative"><span className="grid h-14 w-14 place-items-center rounded-full bg-ink-100 text-lg font-bold text-[#9d4300]">{initials}</span><IconShieldCheck className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-accent-500 p-1 text-white" /></div><div className="min-w-0"><h2 className="break-words font-display text-xl font-bold">{user.name}</h2><p className="mt-1 font-mono text-xs text-ink-500">{maskAadhaarId(user.digilockerId)}</p><p className="mt-1 text-xs text-brand-700">{say('Account name · View only','खाता नाम · केवल देखने हेतु')}</p></div></div>
        <p className="mt-4 rounded-lg bg-ink-50 p-3 text-xs leading-relaxed text-ink-500">{say('This website uses test Aadhaar/DigiLocker login, not live UIDAI verification. Your account name is read-only. Never enter a real Aadhaar number.','यह वेबसाइट परीक्षण आधार/डिजिलॉकर लॉगिन उपयोग करती है, वास्तविक UIDAI सत्यापन नहीं। नाम बदला नहीं जा सकता। वास्तविक आधार नंबर न डालें।')}</p>
        <div className="mt-3 grid grid-cols-2 gap-2"><div className="rounded-lg bg-ink-100 p-3"><IconAward className="mb-1 h-5 w-5 text-accent-600" /><p className="text-xs text-ink-500">{t('settings.civicPoints.heading')}</p><p className="font-bold">{computeCivicPoints(myReports)}</p></div><div className="rounded-lg bg-ink-100 p-3"><IconCheck className="mb-1 h-5 w-5 text-brand-700" /><p className="text-xs text-ink-500">{say('Reports resolved','हल की गई रिपोर्ट')}</p><p className="font-bold">{myReports.filter(r => r.status === 'resolved').length}</p></div></div>
      </div>
      <Section title={say('Identity & Public Visibility','पहचान और सार्वजनिक दृश्यता')} description={say('Choose how your name appears on reports. This changes display fields, not ownership or previously downloaded copies.','रिपोर्ट पर नाम का प्रदर्शन चुनें। इससे स्वामित्व या पहले डाउनलोड हुई प्रतियाँ नहीं बदलतीं।')}>
        <div className={card}><PublicNameSelect label={say('Public name','सार्वजनिक नाम')} options={options} value={preferences.visibility} onChange={value => set('visibility', value)} /><p className="mt-3 break-words text-sm font-semibold text-[#9d4300]">{publicName(user.name,preferences.visibility)}</p></div>
        <div className={card + ' divide-y divide-ink-100'}>{toggles.slice(0,2).map(([key,label,description]) => <Toggle key={key} label={label} description={description} value={preferences[key]} onChange={v => set(key,v)} />)}</div>
      </Section>
      <Section color="bg-sky-600" title={say('Data Controls & Privacy','डेटा नियंत्रण और गोपनीयता')} description={say('Manage device storage and upload size. Drafts and history stay in this browser.','डिवाइस स्टोरेज और अपलोड आकार नियंत्रित करें। ड्राफ्ट और इतिहास इसी ब्राउज़र पर रहते हैं।')}>
        <div className={card + ' divide-y divide-ink-100'}>{toggles.slice(2).map(([key,label,description]) => <Toggle key={key} label={label} description={description} value={preferences[key]} onChange={v => set(key,v)} />)}</div>
        <div className={card + ' space-y-3'}><button type="button" onClick={exportData} className="flex min-h-16 w-full items-center justify-between gap-3 rounded-lg bg-ink-100 p-3 text-left"><span><span className="block text-sm font-semibold">{say('Export My Civic Data','मेरा नागरिक डेटा निर्यात करें')}</span><span className="text-xs text-ink-500">{say('Download reports, reviews & settings as JSON','रिपोर्ट, समीक्षा और सेटिंग्स JSON में डाउनलोड करें')}</span></span><IconArrowRight className="h-5 w-5 shrink-0" /></button>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-ink-100 p-3"><div><p className="text-sm font-semibold">{say('Local Draft & Location Cache','स्थानीय ड्राफ्ट और स्थान कैश')}</p><p className="text-xs text-ink-500">{(cacheBytes/1024).toFixed(1)} KB · {say('Browser map tiles not included','ब्राउज़र मानचित्र कैश शामिल नहीं')}</p></div><button type="button" onClick={clearCache} className="min-h-11 rounded-full bg-ink-200 px-4 text-xs font-semibold">{say('Clear Cache','कैश साफ करें')}</button></div></div>
      </Section>
      <Section color="bg-ink-500" title={say('Help & Feedback','सहायता और प्रतिक्रिया')}>
        <div className={card}><h3 className="text-sm font-semibold">{say('Civic Hotline Directory','नागरिक हेल्पलाइन')}</h3><div className="mt-3 grid grid-cols-2 gap-2"><a href="tel:1033" className="rounded-lg bg-orange-100 p-3 text-center text-orange-900"><strong className="block text-xl">1033</strong><span className="text-[10px]">NHAI</span></a><a href="tel:112" className="rounded-lg bg-red-100 p-3 text-center text-red-900"><strong className="block text-xl">112</strong><span className="text-[10px]">{say('Emergency','आपातकाल')}</span></a></div><p className="mt-3 text-xs text-ink-500">{say('External helplines, not Road India dispatch.','बाहरी हेल्पलाइन, रोड इंडिया डिस्पैच नहीं।')} <a href="https://112.gov.in/" target="_blank" rel="noreferrer" className="underline">112</a> · <a href="https://tis.nhai.gov.in/TollInformation.aspx?TollPlazaID=5928" target="_blank" rel="noreferrer" className="underline">NHAI</a></p></div>
        <div className={card + ' space-y-5'}>
          <button type="button" onClick={() => setBug(!bug)} aria-expanded={bug} className="flex min-h-11 w-full items-center justify-between gap-2 text-left text-sm font-semibold">{say('Report a Website Bug / Glitch','वेबसाइट की समस्या बताएँ')}<IconArrowRight className="h-4 w-4 shrink-0" /></button>
          {bug && <div className="space-y-3"><label className="block text-xs text-ink-500" htmlFor="bug-description">{say('Describe the issue without personal information. Download diagnostics or open a GitHub issue to send it. Nothing uploads automatically.','व्यक्तिगत जानकारी के बिना समस्या लिखें। निदान डाउनलोड करें या GitHub पर भेजें। कुछ भी अपने आप अपलोड नहीं होता।')}</label><textarea id="bug-description" value={bugText} onChange={e => setBugText(e.target.value)} maxLength={3000} className="input-field min-h-24 w-full" /><button type="button" disabled={!bugText.trim()} onClick={() => downloadJson('road-india-bug.json', { description: bugText, browser: navigator.userAgent, viewport: { width: window.innerWidth, height: window.innerHeight }, date: new Date().toISOString() })} className="min-h-11 rounded-lg bg-ink-100 px-3 text-xs font-semibold disabled:opacity-50">{say('Download diagnostic file','निदान फ़ाइल डाउनलोड करें')}</button><a className="block text-sm text-brand-700 underline" href={REPO + '/issues/new'} target="_blank" rel="noreferrer">{say('Open GitHub issue','GitHub समस्या खोलें')}</a></div>}
          <div className="border-t border-ink-100 pt-5"><h3 className="text-sm font-semibold">{say('Rate Road India Experience','रोड इंडिया अनुभव को रेट करें')}</h3><p className="mt-1 text-xs text-ink-500">{say('Your rating is saved to your account with Save Preferences.','प्राथमिकताएँ सहेजें दबाने पर रेटिंग खाते में सहेजी जाएगी।')}</p><div className="mt-3 flex justify-center rounded-lg bg-ink-50 p-3 [&_button]:h-11 [&_button]:w-9 sm:[&_button]:w-11 [&_svg]:mx-auto"><StarRatingInput value={preferences.rating} onChange={v => set('rating',v)} /></div></div>
          <h3 className="text-sm font-semibold">{say('Frequently Asked Questions','अक्सर पूछे जाने वाले प्रश्न')}</h3>{faqs.map(([q,a]) => <details key={q} className="rounded-lg bg-ink-50 p-3"><summary className="cursor-pointer text-sm font-semibold leading-relaxed">{q}</summary><p className="mt-3 text-xs leading-relaxed text-ink-500">{a}</p></details>)}
        </div>
      </Section>
      <footer className="mt-8 space-y-3 text-center"><Logo className="mx-auto h-10 w-10" /><p className="text-sm font-bold">Road India v1.0.0</p><p className="text-xs text-ink-500">Report it. Fix it faster.</p><details className="rounded-lg bg-white p-3 text-left text-xs text-ink-500"><summary className="cursor-pointer font-semibold">{say('Terms & Privacy','शर्तें और गोपनीयता')}</summary><p className="mt-3 leading-relaxed">{say('Use test identity information only. Reports, photos, locations and chosen names are public. Do not upload sensitive information. AI guidance can be wrong and is not an official decision. Local drafts are not encrypted; clear them on shared devices. This site does not guarantee response times or provide emergency services.','केवल परीक्षण पहचान उपयोग करें। रिपोर्ट, फ़ोटो, स्थान और चुने नाम सार्वजनिक हैं। संवेदनशील जानकारी न डालें। AI गलत हो सकता है और सरकारी निर्णय नहीं है। ड्राफ्ट एन्क्रिप्टेड नहीं हैं; साझा डिवाइस पर साफ करें। यह साइट समय सीमा की गारंटी या आपातकालीन सेवा नहीं देती।')}</p></details><a className="inline-block min-h-11 py-3 text-xs text-brand-700 underline" href={REPO + '/blob/main/LICENSE'} target="_blank" rel="noreferrer">{say('Open Source · MIT License','ओपन सोर्स · MIT लाइसेंस')}</a></footer>
      <div className="mt-5 space-y-3"><button type="button" disabled={busy} onClick={save} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent-500 px-4 font-semibold text-white shadow disabled:opacity-50"><IconCheck className="h-5 w-5" />{busy ? say('Saving…','सहेज रहे हैं…') : say('Save Preferences','प्राथमिकताएँ सहेजें')}</button><button type="button" disabled={busy} onClick={async () => { if (window.confirm(say('Sign out? Unsaved preferences will be lost.','लॉग आउट करें? बिना सहेजी सेटिंग्स खो जाएँगी।'))) { try { await logout() } catch { showToast(say('Could not sign out.','लॉग आउट नहीं हुआ।'),'error') } } }} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-ink-100 px-4 text-sm font-semibold text-red-700"><IconLogOut className="h-4 w-4" />{say('Sign Out of Civic Account','नागरिक खाते से लॉग आउट करें')}</button></div>
    </PageTransition><MobileBottomNav />
  </div>
}

import { useMemo, useRef, useState } from 'react'
import { useReports } from '../context/useAppContext'
import { useLanguage } from '../context/useAppContext'
import { useToast } from '../context/useAppContext'
import { CATEGORIES, STATUSES, normalizeCategoryId, reportTypeIds, getTypesLabel } from '../data/categoryTypes'
import { toDate, timeAgo } from '../lib/time'
import { TIME_RANGES, uniqueValues } from '../lib/reportFilters'
import AdminLayout from '../components/AdminLayout'
import FilterDropdown from '../components/FilterDropdown'
import StatusBadge from '../components/StatusBadge'
import AdminStatusSelect from '../components/AdminStatusSelect'
import FeedbackBadge from '../components/FeedbackBadge'
import ReportDetailModal from '../components/LazyReportDetailModal'
import { ReportLocationMap } from '../components/LazyMaps'
import AdminResolutionPanel from '../components/AdminResolutionPanel'
import { IconCheckCircle, IconClock, IconListChecks, IconSearch, IconMapPin, IconShieldCheck } from '../components/Icons'

export default function Admin() {
  const { reports, loading, updateReportStatus } = useReports()
  const { t, lang } = useLanguage()
  const { showToast } = useToast()
  const say = (en, hi) => lang === 'hi' ? hi : en
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [type, setType] = useState('all')
  const [time, setTime] = useState('all')
  const [state, setState] = useState('all')
  const [district, setDistrict] = useState('all')
  const [city, setCity] = useState('all')
  const [page, setPage] = useState(0)
  const [selectedId, setSelectedId] = useState(null)
  const [detailsId, setDetailsId] = useState(null)
  const [updating, setUpdating] = useState('')
  const panel = useRef(null)
  const managed = useMemo(() => reports.filter(r => normalizeCategoryId(r.category) === 'issue'), [reports])
  const selected = managed.find(r => r.id === selectedId)
  const details = managed.find(r => r.id === detailsId)
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase().replace(/^#/, '')
    const range = TIME_RANGES.find(r => r.id === time)
    return managed.filter(r =>
      (status === 'all' || r.status === status) &&
      (type === 'all' || reportTypeIds(r).includes(type)) &&
      (state === 'all' || r.location?.state === state) &&
      (district === 'all' || r.location?.district === district) &&
      (city === 'all' || r.location?.city === city) &&
      (!range?.ms || toDate(r.createdAt).getTime() >= Date.now() - range.ms) &&
      (!q || [r.id, r.description, r.createdByName, r.location?.address, r.resolutionProof?.workOrder, getTypesLabel(t,r.category,reportTypeIds(r))].some(v => String(v || '').toLowerCase().includes(q)))
    ).sort((a,b) => toDate(b.createdAt) - toDate(a.createdAt))
  }, [managed, search, status, type, state, district, city, time, t])
  const pageCount = Math.max(1, Math.ceil(filtered.length / 6))
  const currentPage = Math.min(page, pageCount - 1)
  const rows = filtered.slice(currentPage * 6, currentPage * 6 + 6)
  const states = uniqueValues(managed,'state')
  const districts = uniqueValues(managed,'district', r => state === 'all' || r.location?.state === state)
  const cities = uniqueValues(managed,'city', r => (state === 'all' || r.location?.state === state) && (district === 'all' || r.location?.district === district))
  const options = (values, key) => [{value:'all',label:t(key)},...values.map(value => ({value,label:value}))]
  const change = setter => value => { setter(value); setPage(0) }
  function reset() { setSearch('');setStatus('all');setType('all');setTime('all');setState('all');setDistrict('all');setCity('all');setPage(0) }
  function selectReport(id) { setSelectedId(id); if (window.innerWidth < 1280) requestAnimationFrame(() => panel.current?.scrollIntoView({behavior:'smooth',block:'start'})) }
  async function changeStatus(id, value) {
    if (!['submitted', 'in_review', 'in_progress'].includes(value)) return
    setUpdating(id)
    try { await updateReportStatus(id, value); showToast(t('toast.statusUpdated',{status:t(STATUSES.find(s => s.id === value).labelKey)})) }
    catch { showToast(say('Status update failed. Please retry.', 'स्थिति अपडेट नहीं हुई। फिर प्रयास करें।'), 'error') }
    finally { setUpdating('') }
  }
  function exportCsv() {
    const fields = ['id','description','createdByName','status']
    const cell = value => '"' + String(value ?? '').replace(/^[=+@-]/, "'$&").replaceAll('"','""') + '"'
    const content = [fields.join(','), ...filtered.map(r => fields.map(f => cell(r[f])).join(','))].join('\r\n')
    const url = URL.createObjectURL(new Blob([content], {type:'text/csv;charset=utf-8'}))
    const a = document.createElement('a'); a.href = url; a.download = 'road-india-admin-reports.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(url),1000)
  }
  const weekStart = new Date(); weekStart.setHours(0,0,0,0); weekStart.setDate(weekStart.getDate() - (weekStart.getDay() + 6) % 7)
  const stats = [
    [say('Total Reports','कुल रिपोर्ट'), managed.length, IconListChecks, 'border-ink-200', 'text-ink-900'],
    [say('Active / Unresolved','सक्रिय / अनसुलझी'), managed.filter(r => r.status !== 'resolved').length, IconClock, 'border-accent-500', 'text-accent-600'],
    [say('Resolved This Week','इस सप्ताह हल'), managed.filter(r => r.status === 'resolved' && r.resolvedAt && toDate(r.resolvedAt) >= weekStart).length, IconCheckCircle, 'border-sky-600', 'text-sky-700'],
  ]
  return <AdminLayout>
    <main className="mx-auto max-w-[1700px] px-4 py-6 sm:px-6">
      <p className="text-[11px] text-ink-400">{say('Admin Console › Report Management','व्यवस्थापक कंसोल › रिपोर्ट प्रबंधन')}</p>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-4"><div className="flex flex-wrap items-center gap-3"><h1 className="max-w-xl font-display text-2xl font-bold tracking-tight sm:text-3xl">{say('Admin Operations & Resolution Control','प्रशासनिक संचालन और समाधान नियंत्रण')}</h1><span className="rounded-full bg-orange-100 px-3 py-1 text-[10px] font-bold text-orange-800">{loading ? say('LOADING','लोड हो रहा है') : say('LIVE MONITOR','लाइव मॉनिटर')}</span></div><button type="button" onClick={exportCsv} className="min-h-11 rounded-lg bg-ink-200 px-4 text-xs font-bold">{say('Export CSV','CSV निर्यात करें')}</button></div>
      <section className="my-6 grid gap-4 sm:grid-cols-3">{stats.map(([label,value,Icon,border,color]) => <div key={label} className={'flex items-start justify-between rounded-xl border-b-4 bg-white p-5 shadow-card ' + border}><div><p className="text-[10px] uppercase tracking-wider text-ink-500">{label}</p><p className={'mt-2 font-display text-4xl font-bold ' + color}>{loading ? '—' : value}</p></div><span className={'rounded-lg bg-ink-50 p-3 ' + color}><Icon className="h-5 w-5" /></span></div>)}</section>
      <section className="relative z-20 mb-6 space-y-4 rounded-xl bg-white p-4 shadow-card sm:p-5">
        <div className="flex flex-wrap items-center gap-3"><label className="relative min-w-0 flex-[2_1_280px]"><IconSearch className="absolute left-3 top-3.5 h-4 w-4 text-ink-400" /><input aria-label={t('admin.searchPlaceholder')} placeholder={t('admin.searchPlaceholder')} value={search} onChange={e => change(setSearch)(e.target.value)} className="h-11 w-full rounded-lg bg-ink-50 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-accent-300" /></label><FilterDropdown label={t('admin.status.updateLabel')} value={status} onChange={change(setStatus)} options={[{value:'all',label:t('admin.filter.status.all')},...STATUSES.map(s=>({value:s.id,label:t(s.labelKey)}))]} /><FilterDropdown label={t('reports.filter.time')} value={time} onChange={change(setTime)} options={TIME_RANGES.map(r=>({value:r.id,label:t(r.key)}))} /></div>
        <div className="flex flex-wrap gap-2"><FilterDropdown label={t('reports.filter.state')} value={state} onChange={v=>{change(setState)(v);setDistrict('all');setCity('all')}} options={options(states,'reports.filter.allStates')} /><FilterDropdown label={t('reports.filter.district')} value={district} onChange={v=>{change(setDistrict)(v);setCity('all')}} options={options(districts,'reports.filter.allDistricts')} /><FilterDropdown label={t('reports.filter.city')} value={city} onChange={change(setCity)} options={options(cities,'reports.filter.allCities')} /><FilterDropdown label={say('Issue type','समस्या का प्रकार')} value={type} onChange={change(setType)} options={[{value:'all',label:say('All issues','सभी समस्याएँ')},...CATEGORIES[0].types.map(v=>({value:v.id,label:t(v.labelKey)}))]} /><button type="button" onClick={reset} className="min-h-9 px-2 text-xs font-semibold text-orange-800 underline">{t('reports.filter.clearAll')}</button></div>
      </section>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,7fr)_minmax(340px,5fr)]">
        <div className="min-w-0 space-y-6"><section className="overflow-hidden rounded-xl bg-white shadow-card"><div className="flex flex-wrap items-center justify-between gap-2 bg-ink-100/60 p-4"><h2 className="font-display text-lg font-bold">{say('Incident Queue','रिपोर्ट कतार')}</h2><span className="rounded-full bg-ink-200 px-2 py-1 text-[10px]">{filtered.length} {say('reports','रिपोर्ट')}</span></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-xs"><thead className="border-b border-ink-100 text-[9px] uppercase tracking-wider text-ink-400"><tr>{[say('ID & Evidence','आईडी और प्रमाण'),say('Location & Summary','स्थान और विवरण'),say('Priority','प्राथमिकता'),say('Status','स्थिति'),say('Action','कार्रवाई')].map(h=><th key={h} className="px-3 py-3">{h}</th>)}</tr></thead><tbody className="divide-y divide-ink-100">{rows.map(report=><tr key={report.id} className={selectedId===report.id?'bg-orange-50/60':'hover:bg-ink-50'}><td className="w-24 px-3 py-4 align-top"><button type="button" onClick={()=>setDetailsId(report.id)} className="max-w-24 break-all text-left font-mono text-[10px] font-semibold text-orange-800">#{report.id}</button>{report.photoUrls?.[0] && <img src={report.photoUrls[0]} alt="" loading="lazy" className="mt-2 h-12 w-16 rounded-lg object-cover" />}</td><td className="max-w-56 px-3 py-4 align-top"><button type="button" onClick={()=>setDetailsId(report.id)} className="line-clamp-3 text-left font-semibold leading-relaxed">{report.description}</button><p className="mt-2 line-clamp-2 text-[10px] text-ink-500">{report.location?.address}</p><p className="mt-2 text-[10px] text-ink-400">{report.createdByName} · {timeAgo(report.createdAt)}</p>{report.citizenFeedback && <div className="mt-2"><FeedbackBadge feedback={report.citizenFeedback} /></div>}</td><td className="px-3 py-4 align-top"><span className="rounded-full bg-orange-100 px-2 py-1 text-[10px] font-bold text-orange-800">{report.aiTriage?.severity ? t('severity.'+report.aiTriage.severity) : '—'}</span><p className="mt-2 max-w-28 text-[10px] leading-relaxed text-ink-400">{report.aiTriage?.department}</p></td><td className="px-3 py-4 align-top"><StatusBadge status={report.status} /><AdminStatusSelect reportId={report.id} value={report.status} disabled={updating===report.id} onChange={value=>changeStatus(report.id,value)} /></td><td className="px-3 py-4 align-top"><button type="button" onClick={()=>selectReport(report.id)} className={'min-h-9 whitespace-nowrap rounded-lg px-3 text-[10px] font-bold '+(report.status==='resolved'?'bg-sky-50 text-sky-800':'bg-accent-500 text-white')}>{say(report.status==='resolved'?'View Proof':'Resolve Report',report.status==='resolved'?'प्रमाण देखें':'रिपोर्ट हल करें')}</button></td></tr>)}</tbody></table></div>
          {(loading || !rows.length) && <p role="status" className="p-10 text-center text-sm text-ink-500">{loading?say('Loading reports…','रिपोर्ट लोड हो रही हैं…'):t('admin.empty.title')}</p>}
          <div className="flex items-center justify-between gap-2 bg-ink-50 p-4 text-xs text-ink-500"><span>{filtered.length ? currentPage*6+1 : 0}–{Math.min((currentPage+1)*6,filtered.length)} / {filtered.length}</span><div className="flex items-center gap-2"><button type="button" disabled={!currentPage} onClick={()=>setPage(currentPage-1)} className="min-h-10 rounded bg-white px-3 disabled:opacity-30">←</button><span>{currentPage+1} / {pageCount}</span><button type="button" disabled={currentPage>=pageCount-1} onClick={()=>setPage(currentPage+1)} className="min-h-10 rounded bg-white px-3 disabled:opacity-30">→</button></div></div>
        </section><section className="relative z-0 rounded-xl bg-white p-4 shadow-card"><h3 className="mb-3 flex items-center gap-2 text-sm font-bold"><IconMapPin className="h-4 w-4 text-orange-700" />{say('Selected report location','चुनी रिपोर्ट का स्थान')}</h3>{selected?.location ? <ReportLocationMap key={selected.id} location={selected.location} /> : <p className="py-8 text-center text-xs text-ink-400">{say('Select a report to see its exact location.','सटीक स्थान देखने के लिए रिपोर्ट चुनें।')}</p>}</section></div>
        <div ref={panel} className="min-w-0 scroll-mt-20 xl:sticky xl:top-20">{selected ? <AdminResolutionPanel key={selected.id} report={selected} onClose={()=>setSelectedId(null)} onDetails={()=>setDetailsId(selected.id)} /> : <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-10 text-center"><IconShieldCheck className="mx-auto h-10 w-10 text-accent-500" /><h2 className="mt-4 font-display text-lg font-bold">{say('Resolution Proof & Sign-off','समाधान प्रमाण और पुष्टि')}</h2><p className="mt-2 text-sm leading-relaxed text-ink-500">{say('Choose Resolve Report from the queue to review evidence and close an issue.','प्रमाण की समीक्षा और समस्या बंद करने के लिए कतार से रिपोर्ट हल करें चुनें।')}</p></div>}</div>
      </div>
    </main>
    {details && <ReportDetailModal report={details} onClose={()=>setDetailsId(null)} showUpvote={false} />}
  </AdminLayout>
}

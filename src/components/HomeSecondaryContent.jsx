import { useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useReports, useLanguage } from '../context/useAppContext'
import { getTypesLabel, reportTypeIds, normalizeCategoryId } from '../data/categoryTypes'
import { averageResolution, resolutionDuration, toDate } from '../lib/time'
import { useHomeMetrics } from '../lib/useHomeMetrics'
import ReportDetailModal from './LazyReportDetailModal'
import Symbol from './HomeSymbol'

function ProofPhoto({ src, after, t }) {
  const [failed, setFailed] = useState(false)
  return (
    <span className="home-proof-photo">
      {src && !failed ? (
        <img src={src} alt={t(after ? 'home.stitch.afterPhoto' : 'home.stitch.beforePhoto')} loading="lazy" decoding="async" onError={() => setFailed(true)} />
      ) : (
        <span className="home-proof-missing"><Symbol name="photo_camera" />{t('home.stitch.noPhoto')}</span>
      )}
      <span className={`home-photo-label ${after ? 'home-photo-label-after' : ''}`}>{t(after ? 'home.stitch.after' : 'home.stitch.before')}</span>
    </span>
  )
}

function FixedReport({ report, onOpen }) {
  const { t, lang } = useLanguage()
  const duration = resolutionDuration(report)
  const hours = duration === null ? null : (duration / 3600000).toLocaleString(lang, { maximumFractionDigits: 1 })
  const rawRating = Number(report.citizenFeedback?.rating)
  const rating = rawRating >= 1 && rawRating <= 5 ? rawRating : null
  const types = reportTypeIds(report)
  const title = report.location?.address || report.location?.city || getTypesLabel(t, report.category, types)
  const beforePhoto = report.photoUrls?.find(Boolean)
  const afterPhoto = report.resolutionProof?.photoUrls?.find(Boolean)

  return (
    <button type="button" className="home-proof-card" onClick={() => onOpen(report.id)}>
      <span className="home-proof-heading">
        <span className="home-proof-title">
          <strong><Symbol name={types.some(type => ['waterlogging', 'broken_drainage'].includes(type)) ? 'water_damage' : 'construction'} />{title}</strong>
          <span>{getTypesLabel(t, report.category, types) || report.description}</span>
        </span>
        <span className="home-chip home-chip-warm">{t(hours === null ? 'home.stitch.resolved' : 'home.stitch.fixedIn', { hours })}</span>
      </span>
      <span className="home-proof-photos">
        <ProofPhoto key={`before-${beforePhoto}`} src={beforePhoto} t={t} />
        <ProofPhoto key={`after-${afterPhoto}`} src={afterPhoto} after t={t} />
      </span>
      <span className="home-proof-footer">
        <span><Symbol name="verified" />{t(rating ? 'home.stitch.citizenFeedback' : 'home.stitch.resolutionRecorded')}</span>
        <span className="home-rating">{rating ? `${'★'.repeat(Math.round(rating))}${'☆'.repeat(5 - Math.round(rating))} ${rating.toFixed(1)}` : t('home.stitch.notRated')}</span>
      </span>
    </button>
  )
}


export default function HomeSecondaryContent() {
  const { reports, loading, loadError } = useReports()
  const { t, lang } = useLanguage()
  const metrics = useHomeMetrics()
  const [selectedId, setSelectedId] = useState(null)
  const resolvedReports = useMemo(() => reports
    .filter(report => normalizeCategoryId(report.category) === 'issue' && report.status === 'resolved')
    .sort((a, b) => toDate(b.resolvedAt || b.createdAt) - toDate(a.resolvedAt || a.createdAt)), [reports])
  const selectedReport = reports.find(report => report.id === selectedId)
  const average = loading || loadError ? null : averageResolution(resolvedReports)
  const todayStart = new Date().setHours(0, 0, 0, 0)
  const todayCount = resolvedReports.filter(report => toDate(report.resolvedAt).getTime() >= todayStart).length
  const hasRatings = resolvedReports.some(report => report.citizenFeedback?.rating > 0) || metrics?.satisfaction > 0


  return <>
        <section className="home-impact">
          <div className="home-section-heading"><h2><Symbol name="bar_chart" />{t('home.stitch.impact')}</h2><span>{t('home.stitch.liveTracker')}</span></div>
          <div className="home-metric-grid">
            <div className="home-metric">
              <div className="home-metric-top"><Symbol name="task_alt" /><span className="home-chip home-chip-warm">{loading || loadError ? '—' : t('home.stitch.today', { count: todayCount.toLocaleString(lang) })}</span></div>
              <strong aria-busy={!metrics}>{metrics?.resolved.toLocaleString(lang) ?? '—'}</strong><span>{t('home.stitch.resolvedFixed')}</span>
            </div>
            <div className="home-metric">
              <div className="home-metric-top"><Symbol name="schedule" /><span className="home-chip home-chip-cool">{t('home.stitch.average')}</span></div>
              <strong>{average === null ? '—' : t('home.stitch.hours', { hours: (average / 3600000).toLocaleString(lang, { maximumFractionDigits: 1 }) })}</strong><span>{t('home.stitch.fixTime')}</span>
            </div>
          </div>
          <div className="home-satisfaction">
            <span className="home-satisfaction-icon"><Symbol name="sentiment_very_satisfied" /></span>
            <div><strong>{metrics && hasRatings ? `${metrics.satisfaction.toLocaleString(lang)}%` : '—'}</strong><p>{t('home.stitch.satisfaction')}</p></div>
            <span className="home-chip home-chip-blue">{t(hasRatings ? 'home.stitch.rated' : 'home.stitch.notRated')}</span>
          </div>
          <p className="home-trust-note"><Symbol name="lock" />{t('home.stitch.trust')}</p>
        </section>

        <section className="home-recent">
          <div className="home-section-heading"><h2><Symbol name="verified" />{t('home.stitch.recent')}</h2><NavLink to="/resolved">{t('landing.recent.viewAll')}<Symbol name="arrow_forward" /></NavLink></div>
          <div className="home-proof-list">
            {resolvedReports.slice(0, 2).map(report => <FixedReport key={report.id} report={report} onOpen={setSelectedId} />)}
            {!resolvedReports.length && <p className="home-empty" role="status">{t(loading ? 'common.loading' : loadError ? 'home.stitch.unavailable' : 'home.stitch.noResolved')}</p>}
          </div>
        </section>

        <section className="home-emergency">
          <div className="home-emergency-card">
            <div className="home-emergency-label"><span className="home-emergency-icon"><Symbol name="call" /></span><span><strong>{t('home.stitch.emergency')}</strong><small>{t('home.stitch.emergencyHint')}</small></span></div>
            <div className="home-emergency-actions"><a href="tel:1033" aria-label={t('home.stitch.callHighway')}>NHAI 1033</a><a href="tel:112" aria-label={t('home.stitch.callEmergency')}>112 SOS</a></div>
          </div>
        </section>

    {selectedReport && <ReportDetailModal report={selectedReport} onClose={() => setSelectedId(null)} showUpvote={false} />}
  </>
}

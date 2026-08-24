import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'
import PageTransition from '../components/PageTransition'
import StepProgress from '../components/StepProgress'
import Button from '../components/Button'
import PhotoUpload from '../components/PhotoUpload'
import MapPicker from '../components/MapPicker'
import EmergencyTracker from '../components/EmergencyTracker'
import AiTriageCard from '../components/AiTriageCard'
import { useLanguage } from '../context/LanguageContext'
import { useReports } from '../context/ReportsContext'
import { getCategory } from '../data/categoryTypes'
import { formatTimestamp } from '../lib/time'
import {
  IconChevronLeft,
  IconAlertCircle,
  IconClock,
  IconMapPin,
  IconCheckCircle,
} from '../components/Icons'

const STEP = { DETAILS: 1, LOCATION: 2, SUCCESS: 3 }

export default function ReportFlow() {
  const { category: categoryId } = useParams()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { createReport } = useReports()

  const category = getCategory(categoryId)

  const [step, setStep] = useState(STEP.DETAILS)
  const [type, setType] = useState('')
  const [description, setDescription] = useState('')
  const [photos, setPhotos] = useState([])
  const [location, setLocation] = useState(null)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [now, setNow] = useState(() => new Date())
  const [submittedReport, setSubmittedReport] = useState(null)

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000 * 30)
    return () => clearInterval(id)
  }, [])

  if (!category) return <Navigate to="/home" replace />

  function goToLocation() {
    const nextErrors = {}
    if (!type) nextErrors.type = t('report.step1.error.type')
    if (!description.trim()) nextErrors.description = t('report.step1.error.details')
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length === 0) setStep(STEP.LOCATION)
  }

  async function handleSubmit() {
    if (!location?.lat) {
      setErrors({ location: t('report.step2.error.location') })
      return
    }
    setSubmitting(true)
    try {
      const report = await createReport({
        category: category.id,
        type,
        description: description.trim(),
        photoUrls: photos.map((p) => p.src),
        location,
      })
      setSubmittedReport(report)
      setStep(STEP.SUCCESS)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-ink-50">
      <Navbar />
      <PageTransition className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
        {step !== STEP.SUCCESS && (
          <>
            <button
              type="button"
              onClick={() => (step === STEP.DETAILS ? navigate('/home') : setStep(STEP.DETAILS))}
              className="mb-5 inline-flex items-center gap-1 text-sm font-medium text-ink-500 hover:text-brand-700"
            >
              <IconChevronLeft className="h-4 w-4" />
              {t('common.back')}
            </button>

            <div className="mb-6 flex items-center gap-2">
              <h1 className="font-display text-xl font-bold text-ink-900 sm:text-2xl">
                {t(category.labelKey)}
              </h1>
            </div>

            <div className="mb-8">
              <StepProgress step={step} />
            </div>
          </>
        )}

        <>
          {step === STEP.DETAILS && (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-6 rounded-2xl border border-ink-200 bg-white p-6 shadow-card sm:p-8"
            >
              <h2 className="text-base font-bold text-ink-900">{t('report.step1.title')}</h2>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink-700">
                  {t('report.step1.typeLabel')}
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="input-field"
                >
                  <option value="" disabled>
                    {t('report.step1.typePlaceholder')}
                  </option>
                  {category.types.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {t(opt.labelKey)}
                    </option>
                  ))}
                </select>
                <FieldError message={errors.type} />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink-700">
                  {t('report.step1.photos.label')}{' '}
                  <span className="font-normal text-ink-400">({t('common.optional')})</span>
                </label>
                <p className="mb-2.5 text-xs text-ink-400">{t('report.step1.photos.hint')}</p>
                <PhotoUpload photos={photos} onChange={setPhotos} />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink-700">
                  {t('report.step1.details.label')}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('report.step1.details.placeholder')}
                  rows={4}
                  className="input-field resize-none"
                />
                <FieldError message={errors.description} />
              </div>

              <Button className="w-full" size="lg" onClick={goToLocation}>
                {t('report.step1.continueToLocation')}
              </Button>
            </motion.div>
          )}

          {step === STEP.LOCATION && (
            <motion.div
              key="location"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-5 rounded-2xl border border-ink-200 bg-white p-6 shadow-card sm:p-8"
            >
              <div>
                <h2 className="text-base font-bold text-ink-900">{t('report.step2.title')}</h2>
                <p className="mt-1 text-sm text-ink-500">{t('report.step2.subtitle')}</p>
              </div>

              <MapPicker value={location} onChange={setLocation} />
              <FieldError message={errors.location} />

              <div className="grid gap-3 rounded-xl bg-ink-50 p-4 text-sm sm:grid-cols-2">
                <div className="flex items-start gap-2">
                  <IconMapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" />
                  <div>
                    <p className="font-medium text-ink-700">{t('report.step2.address')}</p>
                    <p className="text-ink-500">{location?.address ?? '—'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <IconClock className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" />
                  <div>
                    <p className="font-medium text-ink-700">{t('report.step2.timestamp')}</p>
                    <p className="text-ink-500">{formatTimestamp(now.toISOString())}</p>
                  </div>
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleSubmit}
                loading={submitting}
                disabled={!location?.lat}
              >
                {submitting ? t('report.step2.submitting') : t('report.step2.submit')}
              </Button>
            </motion.div>
          )}

          {step === STEP.SUCCESS && category.id === 'emergency' && submittedReport && (
            <motion.div
              key="success-emergency"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="flex flex-col items-center"
            >
              <h2 className="font-display text-xl font-bold text-ink-900 sm:text-2xl">
                {t('emergency.tracker.title')}
              </h2>
              <p className="mt-1.5 max-w-sm text-center text-sm text-ink-500">
                {t('emergency.tracker.subtitle')}
              </p>

              <div className="mt-6 w-full">
                <EmergencyTracker
                  createdAt={submittedReport.createdAt}
                  etaMinutes={category.etaMinutes}
                />
              </div>

              <div className="mt-4 w-full">
                <AiTriageCard triage={submittedReport.aiTriage} />
              </div>

              <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row">
                <Button variant="secondary" className="w-full" onClick={() => navigate('/home')}>
                  {t('report.success.reportAnother')}
                </Button>
                <Button className="w-full" onClick={() => navigate('/dashboard')}>
                  {t('report.success.viewDashboard')}
                </Button>
              </div>
            </motion.div>
          )}

          {step === STEP.SUCCESS && category.id !== 'emergency' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="flex flex-col items-center rounded-2xl border border-ink-200 bg-white p-10 text-center shadow-card"
            >
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 14 }}
                className="grid h-16 w-16 place-items-center rounded-full bg-success-50 text-success-600"
              >
                <IconCheckCircle className="h-8 w-8" />
              </motion.span>
              <h2 className="mt-5 font-display text-xl font-bold text-ink-900">{t('report.success.title')}</h2>
              <p className="mt-1.5 max-w-sm text-sm text-ink-500">{t('report.success.subtitle')}</p>

              <div className="mt-5 w-full">
                <AiTriageCard triage={submittedReport?.aiTriage} />
              </div>

              <div className="mt-7 flex w-full flex-col gap-3 sm:flex-row">
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => navigate('/home')}
                >
                  {t('report.success.reportAnother')}
                </Button>
                <Button className="w-full" onClick={() => navigate('/dashboard')}>
                  {t('report.success.viewDashboard')}
                </Button>
              </div>
            </motion.div>
          )}
        </>
      </PageTransition>
    </div>
  )
}

function FieldError({ message }) {
  if (!message) return null
  return (
    <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-emergency-600">
      <IconAlertCircle className="h-3.5 w-3.5" />
      {message}
    </p>
  )
}

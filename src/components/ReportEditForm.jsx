import { useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import PhotoUpload from './PhotoUpload'
import MapPicker from './MapPicker'
import Button from './Button'

/** Inline edit form shown inside ReportDetailModal for a report's own
 * author -- see that file for the isOwner/status gating. Reuses the same
 * PhotoUpload/MapPicker components the original report flow uses, so
 * editing behaves identically to filing (same compression, same reverse
 * geocoding). Only description/photos/location are editable, matching
 * what firestore.rules allows the author to change. */
export default function ReportEditForm({ report, onSave, onCancel }) {
  const { t } = useLanguage()
  const [description, setDescription] = useState(report.description ?? '')
  const [photos, setPhotos] = useState(
    (report.photoUrls ?? []).map((src, i) => ({ id: `existing-${i}`, src }))
  )
  const [location, setLocation] = useState(report.location ?? null)
  const [saving, setSaving] = useState(false)

  const canSave = description.trim() && location?.lat

  async function handleSave(e) {
    e.preventDefault()
    if (!canSave) return
    setSaving(true)
    try {
      await onSave({
        description: description.trim(),
        photoUrls: photos.map((p) => p.src),
        location,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={handleSave}
      onClick={(e) => e.stopPropagation()}
      className="space-y-4 rounded-2xl border border-brand-200 bg-brand-50/40 p-4"
    >
      <p className="text-sm font-semibold text-ink-900">
        {t('reportEdit.title')}
      </p>

      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-ink-700">
          {t('report.step1.details.label')}
        </span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="input-field resize-none text-sm"
        />
      </label>

      <div>
        <span className="mb-1.5 block text-xs font-medium text-ink-700">
          {t('report.step1.photos.label')}
        </span>
        <PhotoUpload photos={photos} onChange={setPhotos} />
      </div>

      <div>
        <span className="mb-1.5 block text-xs font-medium text-ink-700">
          {t('report.step2.title')}
        </span>
        <MapPicker value={location} onChange={setLocation} />
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onCancel}
          disabled={saving}
        >
          {t('common.cancel')}
        </Button>
        <Button type="submit" size="sm" loading={saving} disabled={!canSave}>
          {t('reportEdit.save')}
        </Button>
      </div>
    </form>
  )
}

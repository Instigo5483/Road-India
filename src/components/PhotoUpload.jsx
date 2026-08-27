import { useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { IconCamera, IconX } from './Icons'

const MAX_PHOTOS = 3
const MAX_DIMENSION = 1280
const JPEG_QUALITY = 0.72

/** Downscales/re-encodes an image file to a JPEG data URL capped at
 * MAX_DIMENSION on its longest side. Report photos are stored inline as
 * base64 in Firestore (no Firebase Storage -- see ReportsContext.jsx),
 * which caps a whole document at 1 MiB, so an uncompressed phone photo
 * (often 3-10 MB) would blow past that on its own. */
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = () => {
      const img = new Image()
      img.onerror = reject
      img.onload = () => {
        let { width, height } = img
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          const scale = MAX_DIMENSION / Math.max(width, height)
          width = Math.round(width * scale)
          height = Math.round(height * scale)
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        canvas.getContext('2d').drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = () => resolve(reader.result)
    reader.readAsDataURL(file)
  })
}

export default function PhotoUpload({ photos, onChange }) {
  const { t } = useLanguage()
  const inputRef = useRef(null)

  function handleFiles(fileList) {
    const files = Array.from(fileList).slice(0, MAX_PHOTOS - photos.length)
    files.forEach(async (file) => {
      // Falls back to the uncompressed file if compression fails for any
      // reason (e.g. a format the canvas can't decode) -- a bigger photo
      // is still better than silently dropping it.
      const src = await compressImage(file).catch(() => readAsDataUrl(file))
      onChange((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, src }])
    })
  }

  function removePhoto(id) {
    onChange((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <AnimatePresence initial={false}>
          {photos.map((photo) => (
            <motion.div
              key={photo.id}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="relative h-20 w-20 overflow-hidden rounded-xl border border-ink-100 dark:border-ink-800 shadow-card"
            >
              <img src={photo.src} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(photo.id)}
                className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-ink-900/70 text-white"
              >
                <IconX className="h-3 w-3" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {photos.length < MAX_PHOTOS && (
          <motion.button
            type="button"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => inputRef.current?.click()}
            className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-ink-200 dark:border-ink-700 text-ink-400 dark:text-ink-500 transition-colors hover:border-brand-300 hover:text-brand-600"
          >
            <IconCamera className="h-5 w-5" />
            <span className="text-[11px] font-medium">{t('report.step1.photos.add')}</span>
          </motion.button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        capture="environment"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files)
          e.target.value = ''
        }}
      />
    </div>
  )
}

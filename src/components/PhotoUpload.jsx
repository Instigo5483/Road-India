import { useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { IconCamera, IconX } from './Icons'

const MAX_PHOTOS = 3

export default function PhotoUpload({ photos, onChange }) {
  const { t } = useLanguage()
  const inputRef = useRef(null)

  function handleFiles(fileList) {
    const files = Array.from(fileList).slice(0, MAX_PHOTOS - photos.length)
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onload = () => {
        onChange((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, src: reader.result }])
      }
      reader.readAsDataURL(file)
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
              className="relative h-20 w-20 overflow-hidden rounded-xl border border-ink-100 shadow-card"
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
            className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-ink-200 text-ink-400 transition-colors hover:border-brand-300 hover:text-brand-600"
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

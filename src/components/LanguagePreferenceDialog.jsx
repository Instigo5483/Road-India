import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../context/useAppContext'

export default function LanguagePreferenceDialog() {
  const { lang, languages, setLang, t } = useLanguage()
  const [selected, setSelected] = useState(lang)
  const dialogRef = useRef(null)

  useEffect(() => {
    const dialog = dialogRef.current
    const previousFocus = document.activeElement
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog.showModal()
    return () => {
      dialog.close()
      document.body.style.overflow = overflow
      if (previousFocus?.isConnected) previousFocus.focus()
    }
  }, [])

  return (
    <dialog ref={dialogRef} aria-labelledby="language-preference-title" aria-describedby="language-preference-description" onCancel={event => event.preventDefault()} className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl border border-ink-200 bg-white p-6 text-ink-900 shadow-card-hover backdrop:bg-ink-900/40">
      <form onSubmit={event => { event.preventDefault(); setLang(selected) }}>
        <h2 id="language-preference-title" className="font-display text-2xl font-bold">{t('language.welcome.title')}</h2>
        <p id="language-preference-description" className="mt-2 text-sm text-ink-500">{t('language.welcome.description')}</p>
        <fieldset className="my-5 space-y-3">
          <legend className="sr-only">{t('landing.chooseLanguage')}</legend>
          {languages.map(language => (
            <label key={language.code} className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border p-4 ${selected === language.code ? 'border-accent-500 bg-accent-50' : 'border-ink-200'}`}>
              <input type="radio" name="preferred-language" value={language.code} checked={selected === language.code} onChange={() => setSelected(language.code)} className="h-4 w-4 accent-orange-600" />
              <span lang={language.code} className="font-semibold">{language.nativeLabel}</span>
            </label>
          ))}
        </fieldset>
        <button type="submit" className="min-h-12 w-full rounded-xl bg-accent-500 px-4 py-3 font-semibold text-white hover:bg-accent-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-600">{t('language.welcome.continue')}</button>
        <p className="mt-3 text-center text-xs text-ink-500">{t('language.welcome.hint')}</p>
      </form>
    </dialog>
  )
}

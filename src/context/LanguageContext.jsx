import { useCallback, useEffect, useMemo, useState } from 'react'
import { translate } from '../i18n'
import { LANGUAGES } from '../data/languages'

import { LanguageContext } from './contexts'
const STORAGE_KEY = 'road_india_lang'

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    if (typeof window === 'undefined') return 'en'
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      return LANGUAGES.some(language => language.code === saved) ? saved : 'en'
    } catch { return 'en' }
  })

  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, lang) } catch { /* In-memory language still works. */ }
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback((code) => {
    if (LANGUAGES.some((l) => l.code === code)) {
      setLangState(code)
    }
  }, [])

  const t = useCallback((key, vars) => translate(lang, key, vars), [lang])

  const value = useMemo(
    () => ({ lang, setLang, t, languages: LANGUAGES }),
    [lang, setLang, t]
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

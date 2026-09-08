import { useCallback, useEffect, useMemo, useState } from 'react'
import { translate } from '../i18n'
import { LANGUAGES } from '../data/languages'
import { initialLanguagePreference, languageCookie } from '../lib/languagePreference'

import { LanguageContext } from './contexts'

export function LanguageProvider({ children }) {
  const [{ lang, hasLanguagePreference }, setPreference] = useState(initialLanguagePreference)

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback((code) => {
    if (LANGUAGES.some((l) => l.code === code)) {
      try { document.cookie = languageCookie(code, window.location.protocol === 'https:') } catch { /* In-memory language still works. */ }
      setPreference({ lang: code, hasLanguagePreference: true })
    }
  }, [])

  const t = useCallback((key, vars) => translate(lang, key, vars), [lang])

  const value = useMemo(
    () => ({ lang, hasLanguagePreference, setLang, t, languages: LANGUAGES }),
    [lang, hasLanguagePreference, setLang, t]
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

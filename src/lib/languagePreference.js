import { LANGUAGES } from '../data/languages.js'

export const LANGUAGE_COOKIE = 'road_india_lang'
const validLanguage = code => LANGUAGES.some(language => language.code === code)

export function readLanguageCookie(cookies) {
  const entry = cookies.split(';').map(value => value.trim()).find(value => value.startsWith(`${LANGUAGE_COOKIE}=`))
  if (!entry) return null
  try {
    const code = decodeURIComponent(entry.slice(LANGUAGE_COOKIE.length + 1))
    return validLanguage(code) ? code : null
  } catch { return null }
}

export function languageCookie(code, secure = false) {
  if (!validLanguage(code)) return null
  return `${LANGUAGE_COOKIE}=${encodeURIComponent(code)}; Path=/; Max-Age=31536000; SameSite=Lax${secure ? '; Secure' : ''}`
}

export function initialLanguagePreference() {
  let saved = null
  try { saved = readLanguageCookie(document.cookie) } catch { /* Cookies may be disabled. */ }
  if (saved) return { lang: saved, hasLanguagePreference: true }
  // Keep the previous display language, but ask for an explicit cookie preference.
  let legacy = null
  try { legacy = window.localStorage.getItem(LANGUAGE_COOKIE) } catch { /* Storage may be disabled. */ }
  return { lang: validLanguage(legacy) ? legacy : 'en', hasLanguagePreference: false }
}

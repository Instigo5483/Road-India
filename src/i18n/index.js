import en from './en'
import hi from './hi'

// Only fully-translated dictionaries live here. Any language code from
// data/languages.js that isn't a key of this object automatically falls
// back to English inside translate() below -- so the language switcher
// can list every target language without needing every string translated
// on day one.
export const dictionaries = { en, hi }

export function translate(lang, key, vars) {
  const dict = dictionaries[lang] ?? dictionaries.en
  let str = dict[key] ?? dictionaries.en[key] ?? key

  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      str = str.replaceAll(`{${name}}`, String(value))
    }
  }

  return str
}

import test from 'node:test'
import assert from 'node:assert/strict'
import { initialLanguagePreference, languageCookie, readLanguageCookie } from '../src/lib/languagePreference.js'

test('reads only a supported language from the exact preference cookie', () => {
  assert.equal(readLanguageCookie('session=abc; road_india_lang=hi; other=1'), 'hi')
  for (const cookies of ['', 'road_india_lang=fr', 'old_road_india_lang=hi', 'road_india_lang=%broken']) {
    assert.equal(readLanguageCookie(cookies), null)
  }
})

test('explicit language choices persist for one year across all paths', () => {
  assert.equal(languageCookie('hi', true), 'road_india_lang=hi; Path=/; Max-Age=31536000; SameSite=Lax; Secure')
  assert.equal(languageCookie('en'), 'road_india_lang=en; Path=/; Max-Age=31536000; SameSite=Lax')
  assert.equal(languageCookie('invalid'), null)
})

test('cookie wins over legacy storage, while legacy and default languages still need confirmation', () => {
  const originalDocument = globalThis.document
  const originalWindow = globalThis.window
  try {
    globalThis.window = { localStorage: { getItem: () => 'hi' } }
    globalThis.document = { cookie: 'road_india_lang=en' }
    assert.deepEqual(initialLanguagePreference(), { lang: 'en', hasLanguagePreference: true })
    globalThis.document.cookie = ''
    assert.deepEqual(initialLanguagePreference(), { lang: 'hi', hasLanguagePreference: false })
    globalThis.window.localStorage.getItem = () => { throw new Error('Storage blocked') }
    Object.defineProperty(globalThis.document, 'cookie', { get() { throw new Error('Cookies blocked') } })
    assert.deepEqual(initialLanguagePreference(), { lang: 'en', hasLanguagePreference: false })
  } finally {
    if (originalDocument === undefined) delete globalThis.document
    else globalThis.document = originalDocument
    if (originalWindow === undefined) delete globalThis.window
    else globalThis.window = originalWindow
  }
})

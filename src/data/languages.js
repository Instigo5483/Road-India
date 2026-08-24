// Languages selectable across the app (landing page + dashboard).
// English and Hindi ship with full translations. The rest are listed so
// the selector reflects the real target audience for a pan-India tool;
// their strings fall back to English until translated (see
// src/i18n/index.js). `nativeLabel` is always shown untranslated so a
// speaker of that language can recognise it regardless of current locale.
export const LANGUAGES = [
  { code: 'en', nativeLabel: 'English', complete: true },
  { code: 'hi', nativeLabel: 'हिन्दी', complete: true },
  { code: 'bn', nativeLabel: 'বাংলা', complete: false },
  { code: 'ta', nativeLabel: 'தமிழ்', complete: false },
  { code: 'te', nativeLabel: 'తెలుగు', complete: false },
  { code: 'mr', nativeLabel: 'मराठी', complete: false },
  { code: 'gu', nativeLabel: 'ગુજરાતી', complete: false },
  { code: 'kn', nativeLabel: 'ಕನ್ನಡ', complete: false },
  { code: 'ml', nativeLabel: 'മലയാളം', complete: false },
  { code: 'pa', nativeLabel: 'ਪੰਜਾਬੀ', complete: false },
  { code: 'or', nativeLabel: 'ଓଡ଼ିଆ', complete: false },
  { code: 'ur', nativeLabel: 'اردو', complete: false },
]

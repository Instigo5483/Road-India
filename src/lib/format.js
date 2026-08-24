/**
 * Masks a 12-digit Aadhaar-linked ID as 'XXXX XXXX 1234' -- only the
 * last 4 digits are ever shown. Used on the Settings page.
 */
export function maskAadhaarId(id) {
  const digits = String(id ?? '').replace(/\D/g, '')
  if (digits.length < 4) return '—'
  const masked = 'XXXXXXXX'.slice(0, Math.max(digits.length - 4, 0)) + digits.slice(-4)
  return masked.replace(/(.{4})/g, '$1 ').trim()
}

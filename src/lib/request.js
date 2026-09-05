/** Bound the entire request, including response-body reading, and always clear timers. */
export async function fetchJson(url, options = {}, timeoutMs = 12000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, { ...options, signal: controller.signal })
    if (!response.ok) throw new Error('Request failed: ' + response.status)
    return await response.json()
  } finally {
    clearTimeout(timer)
  }
}

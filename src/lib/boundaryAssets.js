const requests = new Map()

export function loadBoundaryAsset(name) {
  if (!requests.has(name)) {
    const request = fetch(`${import.meta.env.BASE_URL}map-boundaries/${name}.json`, { signal: AbortSignal.timeout(20000) })
      .then(response => {
        if (!response.ok) throw new Error('Boundary data unavailable')
        return response.json()
      })
      .then(data => {
        if (data.type !== 'FeatureCollection' || !Array.isArray(data.features) || !data.features.length) throw new Error('Invalid boundary data')
        return data
      })
      .catch(error => { requests.delete(name); throw error })
    requests.set(name, request)
  }
  return requests.get(name)
}

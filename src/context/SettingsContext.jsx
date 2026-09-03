import { createContext, useContext, useEffect, useState } from 'react'

const SettingsContext = createContext(null)
const STORAGE_KEY = 'road_india_nearby_radius_km'
const DEFAULT_RADIUS_KM = 10
const MIN_RADIUS_KM = 1
const MAX_RADIUS_KM = 100

function clamp(value) {
  if (!Number.isFinite(value)) return DEFAULT_RADIUS_KM
  return Math.min(MAX_RADIUS_KM, Math.max(MIN_RADIUS_KM, Math.round(value)))
}

/** A tiny per-device settings store, the same localStorage-backed pattern
 * as LanguageContext -- there's no server-side user-preferences field for
 * this (see AuthContext), and a "how far counts as nearby" radius is a
 * this-browser convenience, not part of the citizen's verified identity. */
export function SettingsProvider({ children }) {
  const [nearbyRadiusKm, setNearbyRadiusKmState] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_RADIUS_KM
    const stored = Number(window.localStorage.getItem(STORAGE_KEY))
    return stored ? clamp(stored) : DEFAULT_RADIUS_KM
  })

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, String(nearbyRadiusKm))
  }, [nearbyRadiusKm])

  function setNearbyRadiusKm(value) {
    setNearbyRadiusKmState(clamp(value))
  }

  return (
    <SettingsContext.Provider
      value={{ nearbyRadiusKm, setNearbyRadiusKm, MIN_RADIUS_KM, MAX_RADIUS_KM }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used inside <SettingsProvider>')
  return ctx
}

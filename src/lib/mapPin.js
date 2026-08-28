import L from 'leaflet'
// Leaflet's own CSS lives here rather than in main.jsx, so it's part of
// the same lazy chunk as the map components (MapPicker/ReportLocationMap/
// ReportsMapView all import this file) instead of loading eagerly on
// every page, including ones with no map on them at all.
import 'leaflet/dist/leaflet.css'

// A custom pin drawn as an inline SVG data URI, so the map never depends
// on Leaflet's default marker image assets (a common bundler footgun).
// Shared by MapPicker.jsx (interactive) and ReportLocationMap.jsx
// (read-only) so both use the identical pin.
export function createPinIcon() {
  return L.divIcon({
    className: 'road-india-pin',
    html: `
      <div class="road-india-pin__wrap">
        <div class="road-india-pin__pulse"></div>
        <svg width="38" height="46" viewBox="0 0 24 30" fill="none">
          <path d="M12 29S1 17.7 1 10.5A11 11 0 1 1 23 10.5C23 17.7 12 29 12 29Z" fill="#1e40af"/>
          <circle cx="12" cy="10.5" r="4.2" fill="white"/>
        </svg>
      </div>`,
    iconSize: [38, 46],
    iconAnchor: [19, 44],
  })
}

import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import { indiaViewportBounds } from '../lib/indiaMapBounds'

export default function IndiaMapBounds() {
  const map = useMap()
  useEffect(() => {
    const update = () => {
      const zoom = map.getZoom()
      map.setMaxBounds(indiaViewportBounds(map.getSize(),
        point => map.project(point, zoom), point => map.unproject(point, zoom)))
    }
    update()
    map.on('zoomend resize', update)
    return () => { map.off('zoomend resize', update) }
  }, [map])
  return null
}

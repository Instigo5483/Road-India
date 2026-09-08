import { NavLink } from 'react-router-dom'
import { useLanguage } from '../context/useAppContext'
import { resolutionGradient } from '../lib/resolutionColor'
import Symbol from './HomeSymbol'

export function HomeMapAttribution() {
  return <div className="home-map-attribution">
    <a href="https://leafletjs.com/">Leaflet</a> | © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors · <a href="https://www.geoboundaries.org/">geoBoundaries</a> / <a href="https://github.com/datameet/maps">DataMeet</a> (<a href="https://creativecommons.org/licenses/by/2.5/in/">CC BY 2.5 IN</a>)
  </div>
}

export default function HomeMapFrame({ activeCount = '—', children }) {
  const { t } = useLanguage()
  return <section className="home-map-card" aria-label={t('home.map.label')}>
    <div className="home-map-heading">
      <div><h2>{t('home.stitch.mapTitle')}</h2><span>{t('home.stitch.active', { count: activeCount })}</span></div>
      <NavLink to="/data">{t('home.stitch.exploreMap')}<Symbol name="arrow_forward" /></NavLink>
    </div>
    {children}
    <div className="home-resolution-legend">
      <strong>{t('data.heat.compare')}</strong>
      <div className="home-resolution-ramp" aria-hidden="true" style={{ background: resolutionGradient }} />
      <div className="home-resolution-ticks" aria-hidden="true"><span>0%</span><span>50%</span><span>100%</span></div>
      <p>{t('home.map.legend')}</p><p>{t('home.map.dragHint')}</p>
    </div>
  </section>
}

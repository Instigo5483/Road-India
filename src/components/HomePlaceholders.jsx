import { useLanguage } from '../context/useAppContext'
import HomeMapFrame, { HomeMapAttribution } from './HomeMapFrame'

export function HomeMapPlaceholder({ failed = false }) {
  const { t } = useLanguage()
  return <HomeMapFrame>
    <div className="home-india-map home-map-loading" role={failed ? 'alert' : 'status'}>{t(failed ? 'home.stitch.unavailable' : 'common.loading')}</div>
    <HomeMapAttribution />
  </HomeMapFrame>
}

export function HomeSecondaryPlaceholder() {
  return <div className="home-secondary-placeholder" aria-hidden="true">
    <div className="home-secondary-placeholder-impact" />
    <div className="home-secondary-placeholder-recent" />
  </div>
}

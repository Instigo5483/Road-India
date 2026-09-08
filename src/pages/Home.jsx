import { lazy, Suspense } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import Symbol from '../components/HomeSymbol'
import { IconCamera } from '../components/Icons'
import { HomeMapPlaceholder, HomeSecondaryPlaceholder } from '../components/HomePlaceholders'
import HomeSectionBoundary from '../components/HomeSectionBoundary'
import { useHomeLoadOrder } from '../lib/useHomeLoadOrder'
import LanguageSelector from '../components/LanguageSelector'
import Logo from '../components/Logo'

import { useAuth, useLanguage } from '../context/useAppContext'

import '../styles/home-fonts.css'
import '../styles/home.css'

const HomeHeatmapCard = lazy(() => import('../components/HomeHeatmapCard'))
const HomeSecondaryContent = lazy(() => import('../components/HomeSecondaryContent'))

const navigation = [
  { to: '/home', label: 'nav.mobile.home', icon: 'home' },
  { to: '/reports', label: 'nav.mobile.ongoing', icon: 'warning' },
  { to: '/resolved', label: 'nav.mobile.resolved', icon: 'task_alt' },
  { to: '/data', label: 'nav.mobile.data', icon: 'bar_chart' },
  { to: '/dashboard', label: 'nav.mobile.myReports', icon: 'folder_shared' },
]

export default function Home() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const { stage, mapReady } = useHomeLoadOrder()

  function reportIssue() {
    const path = '/report/issue'
    if (user) navigate(path)
    else navigate('/login', { state: { from: { pathname: path } } })
  }

  return (
    <div className="home-stitch">
      <header className="home-header">
        <div className="home-header-inner">
          <NavLink to="/home" className="home-brand">
            <Logo className="home-logo" />
            <span><strong>{t('common.appName')}</strong><small>{t('nav.home')}</small></span>
          </NavLink>
          <nav className="home-desktop-nav" aria-label={t('nav.home')}>
            {navigation.map(item => <NavLink key={item.to} to={item.to}>{t(item.label)}</NavLink>)}
          </nav>
          <div className="home-header-actions">
            <LanguageSelector compact />
            <button type="button" className="home-profile" aria-label={t('home.stitch.profile')} onClick={() => navigate(user ? '/settings' : '/login')}><Symbol name="person" /></button>
          </div>
        </div>
      </header>

      <main className="home-content">
        <section className="home-hero">
          <div className="home-intro">
            <p className="home-eyebrow"><Symbol name="verified" />{t('home.stitch.eyebrow')}</p>
            <h1>{t('home.stitch.title')} <span>{t('home.stitch.speed')}</span></h1>
            <p className="home-subtitle">{t('home.stitch.subtitle')}</p>
          </div>
          <button type="button" className="home-report-action" onClick={reportIssue}>
            <span className="home-camera"><IconCamera aria-hidden="true" className="h-6 w-6" /></span>
            <span className="home-report-label"><strong>{t('home.stitch.cta')}</strong><small>{t('home.stitch.ctaHint')}</small></span>
            <span className="home-add"><span aria-hidden="true">+</span></span>
          </button>
          <HomeSectionBoundary onError={mapReady} fallback={<HomeMapPlaceholder failed />}>
            {stage >= 1 ? <Suspense fallback={<HomeMapPlaceholder />}><HomeHeatmapCard onReady={mapReady} /></Suspense> : <HomeMapPlaceholder />}
          </HomeSectionBoundary>
        </section>

        <HomeSectionBoundary fallback={<section className="home-recent home-empty" role="alert">{t('home.stitch.unavailable')}</section>}>
          {stage >= 2 ? <Suspense fallback={<HomeSecondaryPlaceholder />}><HomeSecondaryContent /></Suspense> : <HomeSecondaryPlaceholder />}
        </HomeSectionBoundary>
      </main>

      <nav className="home-bottom-nav" aria-label={t('nav.home')}><div>{navigation.map(item => <NavLink key={item.to} to={item.to}><Symbol name={item.icon} /><span>{t(item.label)}</span></NavLink>)}</div></nav>
    </div>
  )
}

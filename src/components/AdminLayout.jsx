import { NavLink, useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthContext'
import { useLanguage } from '../context/LanguageContext'
import Logo from './Logo'
import LanguageSelector from './LanguageSelector'
import { IconLogOut, IconShieldCheck, IconChartBar } from './Icons'

export default function AdminLayout({ children }) {
  const { logoutAdmin } = useAdminAuth()
  const { t, lang } = useLanguage()
  const navigate = useNavigate()
  const links = [
    { path: '/admin', label: lang === 'hi' ? 'सभी रिपोर्ट' : 'All Reports', icon: IconShieldCheck },
    { path: '/admin/analytics', label: lang === 'hi' ? 'विश्लेषण' : 'Analytics', icon: IconChartBar },
  ]
  function logout() { logoutAdmin(); navigate('/admin/login', { replace: true }) }
  function navigation(mobile = false) {
    return links.map(({ path, label, icon: Icon }) => <NavLink key={path} to={path} end className={({ isActive }) => `flex min-h-11 items-center gap-3 rounded-lg px-3 font-semibold ${mobile ? 'text-xs' : 'w-full text-sm'} ${isActive ? 'bg-accent-500 text-white' : 'text-ink-500 hover:bg-ink-50'}`}><Icon className="h-5 w-5" />{label}</NavLink>)
  }
  return <div className="min-h-screen bg-[#f8f9fa] text-ink-900">
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col justify-between bg-white p-5 lg:flex">
      <div><button type="button" onClick={() => navigate('/home')} className="flex items-center gap-3 text-left"><Logo className="h-9 w-9" /><span><strong className="font-display text-lg">Road India</strong><span className="block text-xs text-ink-400">Civic Portal</span></span></button>
        <p className="mt-6 inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wide"><IconShieldCheck className="h-3 w-3" />{lang === 'hi' ? 'व्यवस्थापक कंसोल' : 'Admin console'}</p>
        <nav aria-label={lang === 'hi' ? 'व्यवस्थापक नेविगेशन' : 'Admin navigation'} className="mt-6 space-y-2">{navigation()}</nav>
      </div>
      <button type="button" onClick={logout} className="flex items-center gap-3 rounded-xl bg-ink-50 p-3 text-sm"><IconLogOut className="h-5 w-5" />{t('admin.logout')}</button>
    </aside>
    <div className="lg:pl-60">
      <header className="sticky top-0 z-30 flex min-h-16 flex-wrap items-center justify-between gap-2 border-b border-ink-100 bg-white/95 px-4 py-2 backdrop-blur-xl sm:px-6"><div className="flex items-center gap-2"><Logo className="h-8 w-8" /><span className="font-display text-lg font-bold">Road India Admin</span></div><div className="flex items-center gap-2"><LanguageSelector variant="neutral" /><button type="button" onClick={logout} className="grid h-10 w-10 place-items-center rounded-full bg-ink-50 lg:hidden" aria-label={t('admin.logout')}><IconLogOut className="h-4 w-4" /></button></div></header>
      <nav aria-label={lang === 'hi' ? 'व्यवस्थापक नेविगेशन' : 'Admin navigation'} className="flex flex-wrap gap-2 px-4 pt-4 sm:px-6 lg:hidden">{navigation(true)}</nav>
      {children}
    </div>
  </div>
}

import { useEffect } from 'react'

// Scopes PWA installability to /team/* only, so citizens browsing the main
// site never see an "install app" prompt meant for response teams (see the
// note about this in the conversation that led here -- one manifest per
// origin by default, so this has to be swapped in/out per-route by hand).
//
// iOS Safari has no programmatic "install" prompt (unlike Android Chrome)
// -- a team member has to use Share -> Add to Home Screen manually, which
// is also the only way iOS enables Web Push for a site at all (Safari
// 16.4+). TeamLogin/TeamDashboard show a one-line hint about this.
export function useTeamPwaMeta() {
  useEffect(() => {
    const manifestLink = upsertLink('manifest', '/team-manifest.json')
    const appleTouchIcon = upsertLink('apple-touch-icon', '/favicon.svg')
    const appleCapable = upsertMeta('apple-mobile-web-app-capable', 'yes')
    const appleTitle = upsertMeta('apple-mobile-web-app-title', 'RI Response')
    const themeColor = document.querySelector('meta[name="theme-color"]')
    const previousThemeColor = themeColor?.getAttribute('content')
    themeColor?.setAttribute('content', '#1e3a8a')

    return () => {
      manifestLink.remove()
      appleTouchIcon.remove()
      appleCapable.remove()
      appleTitle.remove()
      if (previousThemeColor) themeColor?.setAttribute('content', previousThemeColor)
    }
  }, [])
}

function upsertLink(rel, href) {
  const el = document.createElement('link')
  el.rel = rel
  el.href = href
  document.head.appendChild(el)
  return el
}

function upsertMeta(name, content) {
  const el = document.createElement('meta')
  el.name = name
  el.content = content
  document.head.appendChild(el)
  return el
}

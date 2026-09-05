import { Component } from 'react'

/** A recoverable screen for rendering/chunk failures instead of a blank page. */
export default class ErrorBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (!this.state.failed) return this.props.children
    const hindi = document.documentElement.lang === 'hi'
    return <main role="alert" className="grid min-h-screen place-items-center bg-ink-50 p-6">
      <div className="max-w-md rounded-2xl bg-white p-6 text-center shadow-card">
        <h1 className="text-xl font-bold">{hindi ? 'पृष्ठ लोड नहीं हो सका' : 'This page could not load'}</h1>
        <p className="mt-3 text-sm text-ink-500">{hindi ? 'कनेक्शन जाँचकर पृष्ठ दोबारा लोड करें।' : 'Check your connection and reload. Your saved reports will not be deleted.'}</p>
        <button type="button" onClick={() => window.location.reload()} className="mt-5 min-h-11 rounded-lg bg-brand-700 px-5 text-white">{hindi ? 'दोबारा लोड करें' : 'Reload page'}</button>
      </div>
    </main>
  }
}

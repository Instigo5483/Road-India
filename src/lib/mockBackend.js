// A tiny in-memory + localStorage-backed mock backend.
//
// Used only when Firebase is not configured; contexts select the backend.

import { upvotePatch } from './reportValidation.js'
import { reactionPatch } from './resolutionReactions.js'
import { seedReports } from '../data/seedReports.js'

const STORAGE_KEYS = {
  users: 'road_india_users',
  reports: 'road_india_reports',
  session: 'road_india_session',
}

function readStore(key, fallback) {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeStore(key, value) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage can be unavailable (private mode, quota). Fail silently --
    // the in-memory copy still works for the rest of the session.
  }
}

let users = readStore(STORAGE_KEYS.users, [])
if (!Array.isArray(users)) users = []
let reports = readStore(STORAGE_KEYS.reports, null) ?? seedReports
if (!Array.isArray(reports)) reports = seedReports
let session = readStore(STORAGE_KEYS.session, null)

const listeners = new Set()
function notify() {
  listeners.forEach((fn) => fn())
}

export const mockBackend = {

  subscribe(fn) {
    listeners.add(fn)
    return () => listeners.delete(fn)
  },

  getSession() {
    return session
  },

  async findOrCreateUser({ digilockerId, name, preferredLanguage }) {
    let user = users.find((u) => u.digilockerId === digilockerId)
    if (!user) {
      user = {
        uid: `mock-${digilockerId}`,
        digilockerId,
        name,
        preferredLanguage: preferredLanguage || 'en',
        createdAt: new Date().toISOString(),
      }
      users.push(user)
      writeStore(STORAGE_KEYS.users, users)
    } else if (preferredLanguage && user.preferredLanguage !== preferredLanguage) {
      user = { ...user, preferredLanguage }
      users = users.map((storedUser) =>
        storedUser.uid === user.uid ? user : storedUser
      )
      writeStore(STORAGE_KEYS.users, users)
    }
    session = user
    writeStore(STORAGE_KEYS.session, session)
    notify()
    return user
  },

  async signOut() {
    session = null
    writeStore(STORAGE_KEYS.session, null)
    notify()
  },

  async savePreferences(preferences, preferredLanguage, publicFields) {
    if (!session) throw new Error('Sign in first')
    session = { ...session, preferences, preferredLanguage }
    users = users.map(u => u.uid === session.uid ? session : u)
    reports = reports.map(r => r.createdBy === session.uid ? { ...r, ...publicFields } : r)
    writeStore(STORAGE_KEYS.users, users)
    writeStore(STORAGE_KEYS.session, session)
    writeStore(STORAGE_KEYS.reports, reports)
    notify()
  },

  async listReports() {
    return reports
  },

  async createReport(report) {
    const newReport = {
      ...report,
      id: `local-${Date.now()}-${Math.round(Math.random() * 1e5)}`,
      createdAt: new Date().toISOString(),
      status: report.status ?? 'submitted',
      upvotes: report.upvotes ?? 0,
      upvotedBy: [],
    }
    reports = [newReport, ...reports]
    writeStore(STORAGE_KEYS.reports, reports)
    notify()
    return newReport
  },

  async toggleUpvote(reportId, uid) {
    reports = reports.map((r) => {
      if (r.id !== reportId) return r
      return { ...r, ...upvotePatch(r, uid) }
    })
    writeStore(STORAGE_KEYS.reports, reports)
    notify()
    return reports.find((r) => r.id === reportId)
  },

  async updateReportStatus(reportId, patch) {
    reports = reports.map((r) => (r.id === reportId ? { ...r, ...patch } : r))
    writeStore(STORAGE_KEYS.reports, reports)
    notify()
    return reports.find((r) => r.id === reportId)
  },

  async updateReport(reportId, patch) {
    reports = reports.map((r) => (r.id === reportId ? { ...r, ...patch } : r))
    writeStore(STORAGE_KEYS.reports, reports)
    notify()
    return reports.find((r) => r.id === reportId)
  },

  async setReportFeedback(reportId, citizenFeedback) {
    reports = reports.map((r) => (r.id === reportId ? { ...r, citizenFeedback } : r))
    writeStore(STORAGE_KEYS.reports, reports)
    notify()
    return reports.find((r) => r.id === reportId)
  },

  async reactToResolution(reportId, uid, reaction) {
    if (!session || session.uid !== uid) throw new Error('Sign in first')
    const patch = reactionPatch(reports.find(r => r.id === reportId), uid, reaction)
    reports = reports.map(r => r.id === reportId ? { ...r, ...patch } : r)
    writeStore(STORAGE_KEYS.reports, reports)
    notify()
  },
}

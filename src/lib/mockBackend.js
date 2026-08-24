// A tiny in-memory + localStorage-backed mock backend.
//
// Road India is wired for a real Firebase backend (see lib/firebase.js and
// context/AuthContext.jsx / context/ReportsContext.jsx). But so the app is
// demoable instantly with zero setup -- important for hackathon judging --
// every read/write goes through this module first, and this module
// transparently proxies to real Firestore once `isFirebaseConfigured` is
// true. Nothing else in the app needs to know which mode it's in.

import { isFirebaseConfigured } from './firebase'
import { seedReports } from '../data/seedReports'

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
let reports = readStore(STORAGE_KEYS.reports, null) ?? seedReports
let session = readStore(STORAGE_KEYS.session, null)

const listeners = new Set()
function notify() {
  listeners.forEach((fn) => fn())
}

export const mockBackend = {
  isMock: !isFirebaseConfigured,

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
    }
    session = user
    writeStore(STORAGE_KEYS.session, session)
    notify()
    return user
  },

  async updateUser(uid, patch) {
    users = users.map((u) => (u.uid === uid ? { ...u, ...patch } : u))
    writeStore(STORAGE_KEYS.users, users)
    if (session?.uid === uid) {
      session = { ...session, ...patch }
      writeStore(STORAGE_KEYS.session, session)
    }
    notify()
  },

  async signOut() {
    session = null
    writeStore(STORAGE_KEYS.session, null)
    notify()
  },

  async listReports() {
    return reports
  },

  async listReportsByUser(uid) {
    return reports.filter((r) => r.createdBy === uid)
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
      const already = r.upvotedBy.includes(uid)
      return {
        ...r,
        upvotedBy: already ? r.upvotedBy.filter((id) => id !== uid) : [...r.upvotedBy, uid],
        upvotes: already ? r.upvotes - 1 : r.upvotes + 1,
      }
    })
    writeStore(STORAGE_KEYS.reports, reports)
    notify()
    return reports.find((r) => r.id === reportId)
  },
}

// Shared emergency-dispatch logic used by both the Vercel serverless
// endpoint (api/dispatch.js) and the local Vite dev-server middleware
// (vite.config.js) -- same "one implementation, two entry points" pattern
// as api/_triage-core.js.
//
// This intentionally does NOT use Firebase Cloud Functions. Cloud
// Functions (any generation) require the paid Blaze plan to deploy at
// all, regardless of usage -- the user explicitly wants a fully free
// setup. Firestore, Auth, Storage, and Cloud Messaging are all free on
// the Spark plan; the only thing Cloud Functions would have added here is
// a Firestore-triggered invocation, which this replaces with the client
// calling this endpoint right after creating an emergency report (see
// context/ReportsContext.jsx's createReport). Functionally equivalent for
// a demo; a server-triggered version would need Blaze if added later.
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getMessaging } from 'firebase-admin/messaging'

// Mirrors src/data/teamTypes.js's REQUIRED_TEAMS_BY_EMERGENCY_TYPE --
// duplicated here since api/ is a separate Node runtime from the Vite
// client bundle. Keep both in sync if you add a team/emergency type.
const REQUIRED_TEAMS_BY_EMERGENCY_TYPE = {
  accident: ['ambulance', 'doctor'],
  road_clash: ['police'],
  vehicle_breakdown: ['tow'],
  fire_hazard: ['fire'],
  medical_emergency: ['ambulance', 'doctor'],
  other: ['police'],
}

let adminApp
function getAdminApp(serviceAccountBase64) {
  if (adminApp) return adminApp
  if (getApps().length) {
    adminApp = getApps()[0]
    return adminApp
  }
  if (!serviceAccountBase64) return null

  const serviceAccount = JSON.parse(Buffer.from(serviceAccountBase64, 'base64').toString('utf-8'))
  adminApp = initializeApp({ credential: cert(serviceAccount) })
  return adminApp
}

/** Haversine distance in kilometres -- mirrors src/lib/geo.js's distanceKm. */
function distanceKm(a, b) {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2)
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

async function findNearestAvailableTeam(db, teamType, reportLocation) {
  const snap = await db.collection('teams').where('type', '==', teamType).where('status', '==', 'available').get()

  let nearest = null
  let nearestDistance = Infinity
  snap.forEach((doc) => {
    const team = doc.data()
    if (!team.location) return
    const distance = distanceKm(reportLocation, team.location)
    if (distance < nearestDistance) {
      nearestDistance = distance
      nearest = { id: doc.id, ...team }
    }
  })

  return nearest ? { team: nearest, distanceKm: nearestDistance } : null
}

/** Runs nearest-team matching + push notification for one emergency
 * report. Returns { assignedTeams } always -- never throws, so a flaky
 * push or missing credential never blocks the citizen's report from
 * having already been filed successfully before this was called. */
export async function runDispatch({ reportId, category, type, description, location }, serviceAccountBase64) {
  if (category !== 'emergency' || !location || !reportId) return { assignedTeams: [] }

  try {
    const app = getAdminApp(serviceAccountBase64)
    if (!app) return { assignedTeams: [] }

    const db = getFirestore(app)
    const messaging = getMessaging(app)

    const requiredTypes = REQUIRED_TEAMS_BY_EMERGENCY_TYPE[type] ?? ['police']
    const assignedTeams = []

    for (const teamType of requiredTypes) {
      const match = await findNearestAvailableTeam(db, teamType, location)
      if (!match) continue

      const { team, distanceKm: distance } = match

      await db.collection('teams').doc(team.id).update({ status: 'busy', currentReportId: reportId })

      if (team.fcmToken) {
        await messaging
          .send({
            token: team.fcmToken,
            notification: {
              title: `New ${teamType} dispatch: ${type.replace(/_/g, ' ')}`,
              body: (description ?? '').slice(0, 120) || 'Tap to view details',
            },
            data: { reportId, type: 'emergency-dispatch' },
          })
          .catch(() => {})
      }

      assignedTeams.push({
        teamId: team.id,
        teamType,
        teamName: team.name ?? team.id,
        distanceKm: Number(distance.toFixed(1)),
      })
    }

    if (assignedTeams.length) {
      await db.collection('reports').doc(reportId).update({ assignedTeams })
    }

    return { assignedTeams }
  } catch {
    return { assignedTeams: [] }
  }
}

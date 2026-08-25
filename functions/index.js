// Emergency dispatch: runs whenever a new report is created. If it's an
// emergency, works out which response-team types are needed (mirrors
// src/data/teamTypes.js -- duplicated here since Cloud Functions are a
// separate deployable package, see that file's comment), finds the
// nearest *available* team of each required type, marks it busy, records
// the assignment on the report, and pushes a notification to the team's
// device via Firebase Cloud Messaging.
//
// Runs with the Admin SDK, so it bypasses firestore.rules entirely --
// this is the one piece of the response-team feature that has real
// server-side authority, unlike the client-side passcode gates in
// TeamAuthContext.jsx / AdminAuthContext.jsx.
import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getMessaging } from 'firebase-admin/messaging'
import { logger } from 'firebase-functions'

initializeApp()
const db = getFirestore()
const messaging = getMessaging()

const REQUIRED_TEAMS_BY_EMERGENCY_TYPE = {
  accident: ['ambulance', 'doctor'],
  road_clash: ['police'],
  vehicle_breakdown: ['tow'],
  fire_hazard: ['fire'],
  medical_emergency: ['ambulance', 'doctor'],
  other: ['police'],
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

async function findNearestAvailableTeam(teamType, reportLocation) {
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

export const dispatchEmergencyReport = onDocumentCreated('reports/{reportId}', async (event) => {
  const report = event.data?.data()
  const reportId = event.params.reportId
  if (!report || report.category !== 'emergency' || !report.location) return

  const requiredTypes = REQUIRED_TEAMS_BY_EMERGENCY_TYPE[report.type] ?? ['police']
  const assignedTeams = []

  for (const teamType of requiredTypes) {
    const match = await findNearestAvailableTeam(teamType, report.location)
    if (!match) {
      logger.warn(`No available ${teamType} team found for report ${reportId}`)
      continue
    }

    const { team, distanceKm: distance } = match

    await db.collection('teams').doc(team.id).update({
      status: 'busy',
      currentReportId: reportId,
    })

    if (team.fcmToken) {
      await messaging
        .send({
          token: team.fcmToken,
          notification: {
            title: `New ${teamType} dispatch: ${report.type.replace(/_/g, ' ')}`,
            body: (report.description ?? '').slice(0, 120) || 'Tap to view details',
          },
          data: { reportId, type: 'emergency-dispatch' },
        })
        .catch((err) => logger.error(`FCM send failed for team ${team.id}`, err))
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
})

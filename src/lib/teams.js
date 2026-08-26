// Creates and reassigns response teams from the admin dashboard (see
// pages/AdminAddTeam.jsx and components/AdminReportRow.jsx). The admin
// picks the team's own ID and passcode directly -- there's no per-admin
// identity system here (see context/AdminAuthContext.jsx's comment), so
// letting them choose credentials they can communicate to the team
// however they like is simpler than auto-generating and displaying
// one-time values.
import { doc, getDoc, setDoc, writeBatch } from 'firebase/firestore'
import { db } from './firebase'
import { getCity } from '../data/cities'

/** Creates a new response team at the given city-level base area.
 * Throws Error('ID_TAKEN') if the chosen id is already in use. */
export async function createTeam({ id, passcode, name, type, cityId }) {
  const existing = await getDoc(doc(db, 'teams', id))
  if (existing.exists()) throw new Error('ID_TAKEN')

  const city = getCity(cityId)

  await setDoc(doc(db, 'teams', id), {
    name,
    type,
    location: city ? { lat: city.lat, lng: city.lng, address: city.name, city: city.name } : null,
    passcode,
    status: 'available',
    fcmToken: null,
    currentReportId: null,
  })

  return { id }
}

/** Changes which team is assigned to a given required team-type slot on an
 * emergency report (admin dashboard "reassign" control). Frees the
 * previously assigned team (if any) back to available, marks the new team
 * busy on this report, and updates the report's assignedTeams list.
 * `newTeamId` of null/empty unassigns the slot entirely. */
export async function reassignReportTeam(report, teamType, newTeamId) {
  const batch = writeBatch(db)
  const current = report.assignedTeams?.find((a) => a.teamType === teamType)

  if (current && current.teamId !== newTeamId) {
    batch.update(doc(db, 'teams', current.teamId), { status: 'available', currentReportId: null })
  }

  let nextAssigned = (report.assignedTeams ?? []).filter((a) => a.teamType !== teamType)

  if (newTeamId) {
    const newTeamSnap = await getDoc(doc(db, 'teams', newTeamId))
    const newTeamData = newTeamSnap.data()
    batch.update(doc(db, 'teams', newTeamId), { status: 'busy', currentReportId: report.id })
    nextAssigned = [
      ...nextAssigned,
      { teamId: newTeamId, teamType, teamName: newTeamData?.name ?? newTeamId, distanceKm: null },
    ]
  }

  batch.update(doc(db, 'reports', report.id), { assignedTeams: nextAssigned })
  await batch.commit()
}

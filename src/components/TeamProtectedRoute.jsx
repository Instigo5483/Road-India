import { Navigate } from 'react-router-dom'
import { useTeamAuth } from '../context/TeamAuthContext'
import LoadingScreen from './LoadingScreen'

export default function TeamProtectedRoute({ children }) {
  const { team, loading } = useTeamAuth()

  if (loading) return <LoadingScreen />
  if (!team) return <Navigate to="/team/login" replace />

  return children
}

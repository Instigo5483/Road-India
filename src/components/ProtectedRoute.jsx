import { useMemo } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingScreen from './LoadingScreen'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  // `state` must keep the same object reference across re-renders of this
  // component (only changing when `location` itself actually changes) --
  // passing a fresh `{ from: location }` literal on every render makes
  // <Navigate> re-invoke navigate() on every render too, which was causing
  // a "Maximum update depth exceeded" infinite loop (and a blank page)
  // right after logout, when ProtectedRoute keeps re-rendering as `user`
  // settles to null.
  const state = useMemo(() => ({ from: location }), [location])

  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" state={state} replace />

  return children
}

import { Navigate } from 'react-router-dom'
import { useAdminAuth } from '../context/useAppContext'
import LoadingScreen from './LoadingScreen'

export default function AdminProtectedRoute({ children }) {
  const { isAdmin, loading } = useAdminAuth()
  if (loading) return <LoadingScreen />
  if (!isAdmin) return <Navigate to="/admin/login" replace />
  return children
}

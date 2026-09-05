import { Navigate } from 'react-router-dom'
import { useAdminAuth } from '../context/useAppContext'

export default function AdminProtectedRoute({ children }) {
  const { isAdmin } = useAdminAuth()
  if (!isAdmin) return <Navigate to="/admin/login" replace />
  return children
}

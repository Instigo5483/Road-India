import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { LanguageProvider } from './context/LanguageContext'
import { AuthProvider } from './context/AuthContext'
import { ReportsProvider } from './context/ReportsContext'
import { AdminAuthProvider } from './context/AdminAuthContext'
import { TeamAuthProvider } from './context/TeamAuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AdminProtectedRoute from './components/AdminProtectedRoute'
import TeamProtectedRoute from './components/TeamProtectedRoute'

import Landing from './pages/Landing'
import Login from './pages/Login'
import Home from './pages/Home'
import ReportFlow from './pages/ReportFlow'
import Dashboard from './pages/Dashboard'
import ReportsFeed from './pages/ReportsFeed'
import Settings from './pages/Settings'
import AdminLogin from './pages/AdminLogin'
import Admin from './pages/Admin'
import TeamLogin from './pages/TeamLogin'
import TeamDashboard from './pages/TeamDashboard'

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/report/:category"
          element={
            <ProtectedRoute>
              <ReportFlow />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <ReportsFeed />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <AdminProtectedRoute>
              <Admin />
            </AdminProtectedRoute>
          }
        />
        <Route path="/team/login" element={<TeamLogin />} />
        <Route
          path="/team"
          element={
            <TeamProtectedRoute>
              <TeamDashboard />
            </TeamProtectedRoute>
          }
        />
        <Route path="*" element={<Landing />} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AdminAuthProvider>
          <TeamAuthProvider>
            <ReportsProvider>
              <BrowserRouter>
                <AnimatedRoutes />
              </BrowserRouter>
            </ReportsProvider>
          </TeamAuthProvider>
        </AdminAuthProvider>
      </AuthProvider>
    </LanguageProvider>
  )
}

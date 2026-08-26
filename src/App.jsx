import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
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
import AdminAddTeam from './pages/AdminAddTeam'
import TeamLogin from './pages/TeamLogin'
import TeamDashboard from './pages/TeamDashboard'

function AnimatedRoutes() {
  const location = useLocation()

  return (
    // Deliberately not wrapped in <AnimatePresence> -- it kept the outgoing
    // route's component tree mounted (and re-rendering) during its exit
    // transition, so a <Navigate> fired by a still-mounted ProtectedRoute
    // (e.g. right after logout, once `user` becomes null) kept re-invoking
    // navigate() in a loop ("Maximum update depth exceeded"), leaving a
    // blank page. Same root cause class as the AnimatePresence fixes in
    // Login.jsx and ReportFlow.jsx. Each page still animates in on its own
    // via PageTransition / per-component motion props.
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
      <Route
        path="/admin/teams/new"
        element={
          <AdminProtectedRoute>
            <AdminAddTeam />
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

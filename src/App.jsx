import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { LanguageProvider } from './context/LanguageContext'
import { AuthProvider } from './context/AuthContext'
import { SettingsProvider } from './context/SettingsContext'
import { ReportsProvider } from './context/ReportsContext'
import { AdminAuthProvider } from './context/AdminAuthContext'
import { TeamAuthProvider } from './context/TeamAuthContext'
import { ToastProvider } from './context/ToastContext'
import ProtectedRoute from './components/ProtectedRoute'
import AdminProtectedRoute from './components/AdminProtectedRoute'
import TeamProtectedRoute from './components/TeamProtectedRoute'
import LoadingScreen from './components/LoadingScreen'

import Landing from './pages/Landing'
import Login from './pages/Login'

// Route-level code splitting -- a citizen never downloads the admin/team
// dashboards' JS (and vice versa), and each of these only loads the first
// time its route is actually visited rather than on initial page load.
// Landing/Login stay eager above since they're what almost every visit
// hits first.
const Home = lazy(() => import('./pages/Home'))
const ReportFlow = lazy(() => import('./pages/ReportFlow'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const ReportsFeed = lazy(() => import('./pages/ReportsFeed'))
const ResolvedReports = lazy(() => import('./pages/ResolvedReports'))
const ViewData = lazy(() => import('./pages/ViewData'))
const Settings = lazy(() => import('./pages/Settings'))
const AdminLogin = lazy(() => import('./pages/AdminLogin'))
const Admin = lazy(() => import('./pages/Admin'))
const AdminTeams = lazy(() => import('./pages/AdminTeams'))
const AdminAddTeam = lazy(() => import('./pages/AdminAddTeam'))
const AdminAnalytics = lazy(() => import('./pages/AdminAnalytics'))
const TeamLogin = lazy(() => import('./pages/TeamLogin'))
const TeamDashboard = lazy(() => import('./pages/TeamDashboard'))

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
    <Suspense fallback={<LoadingScreen />}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/resolved" element={<ResolvedReports />} />
        <Route path="/data" element={<ViewData />} />
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
          path="/admin/teams"
          element={
            <AdminProtectedRoute>
              <AdminTeams />
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
        <Route
          path="/admin/analytics"
          element={
            <AdminProtectedRoute>
              <AdminAnalytics />
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
    </Suspense>
  )
}

export default function App() {
  return (
    <LanguageProvider>
      <ToastProvider>
        <AuthProvider>
          <SettingsProvider>
            <AdminAuthProvider>
              <TeamAuthProvider>
                <ReportsProvider>
                  <BrowserRouter>
                    <AnimatedRoutes />
                  </BrowserRouter>
                </ReportsProvider>
              </TeamAuthProvider>
            </AdminAuthProvider>
          </SettingsProvider>
        </AuthProvider>
      </ToastProvider>
    </LanguageProvider>
  )
}

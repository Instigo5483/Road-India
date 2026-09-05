import { Suspense, lazy } from 'react'
import { MotionConfig } from 'framer-motion'
import ErrorBoundary from './components/ErrorBoundary'
import { useReportStatusAlerts } from './lib/useReportStatusAlerts'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { LanguageProvider } from './context/LanguageContext'
import { AuthProvider } from './context/AuthContext'
import { ReportsProvider } from './context/ReportsContext'
import { AdminAuthProvider } from './context/AdminAuthContext'
import { ToastProvider } from './context/ToastContext'
import ProtectedRoute from './components/ProtectedRoute'
import AdminProtectedRoute from './components/AdminProtectedRoute'
import LoadingScreen from './components/LoadingScreen'

const Login = lazy(() => import('./pages/Login'))

// Route-level code splitting -- a citizen never downloads the admin
// dashboards' JS (and vice versa), and each of these only loads the first
// time its route is actually visited rather than on initial page load.
// Pages load only when their route is visited.
const Home = lazy(() => import('./pages/Home'))
const ReportFlow = lazy(() => import('./pages/ReportFlow'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const ReportsFeed = lazy(() => import('./pages/ReportsFeed'))
const ResolvedReports = lazy(() => import('./pages/ResolvedReports'))
const ViewData = lazy(() => import('./pages/ViewData'))
const Settings = lazy(() => import('./pages/Settings'))
const AdminLogin = lazy(() => import('./pages/AdminLogin'))
const Admin = lazy(() => import('./pages/Admin'))
const AdminAnalytics = lazy(() => import('./pages/AdminAnalytics'))

function AnimatedRoutes() {
  useReportStatusAlerts()
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
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/resolved" element={<ResolvedReports />} />
        <Route path="/data" element={<ViewData />} />
        <Route path="/home" element={<Home />} />
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
        <Route path="/reports" element={<ReportsFeed />} />
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
          path="/admin/analytics"
          element={
            <AdminProtectedRoute>
              <AdminAnalytics />
            </AdminProtectedRoute>
          }
        />
        <Route path="*" element={<Home />} />
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
    <MotionConfig reducedMotion="user">
    <LanguageProvider>
      <ToastProvider>
        <AuthProvider>
          <AdminAuthProvider>
              <ReportsProvider>
                <BrowserRouter>
                  <AnimatedRoutes />
                </BrowserRouter>
              </ReportsProvider>
          </AdminAuthProvider>
        </AuthProvider>
      </ToastProvider>
    </LanguageProvider>
    </MotionConfig>
    </ErrorBoundary>
  )
}

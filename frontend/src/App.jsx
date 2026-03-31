import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage     from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import TasksPage     from './pages/TasksPage'
import TeamsPage     from './pages/TeamsPage'
import UsersPage     from './pages/UsersPage'
import Layout        from './components/Layout'

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  return user ? children : <Navigate to="/login" replace />
}
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  return user ? <Navigate to="/dashboard" replace /> : children
}
const AdminRoute = ({ children }) => {
  const { user } = useAuth()
  return user?.role === 'admin' ? children : <Navigate to="/dashboard" replace />
}
const Spinner = () => (
  <div className="min-h-screen bg-ink-50 flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-ink-300 border-t-ink-700 rounded-full animate-spin" />
  </div>
)

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="tasks"     element={<TasksPage />} />
            <Route path="teams"     element={<TeamsPage />} />
            <Route path="users"     element={<AdminRoute><UsersPage /></AdminRoute>} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

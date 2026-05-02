import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, requiredRole = null }) {
  const { isAuthenticated, loading, user } = useAuth()

  if (loading) {
    return (
      <div className="paper-bg min-h-screen flex items-center justify-center">
        <div className="chunky-card p-8 text-center">
          <div className="w-10 h-10 border-4 border-ink border-t-burn rounded-full animate-spin mx-auto mb-3" />
          <div className="font-display text-xs text-ink uppercase tracking-wider">Loading...</div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && user?.role !== requiredRole) {
    // wrong role — bounce to /login (forces re-auth with the right role)
    return <Navigate to="/login" replace />
  }

  return children
}

import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

const TOKEN_KEY = 'flex_staff_token'
const USER_KEY = 'flex_staff_user'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY)
      const storedUser = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY)
      if (storedToken && storedUser && storedUser !== 'undefined') {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
      } else {
        clearStorage()
      }
    } catch {
      clearStorage()
    }
    setLoading(false)
  }, [])

  const clearStorage = () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(USER_KEY)
  }

  const login = async (username, password, role, remember = false) => {
    let data
    try {
      const response = await api.post('/auth/staff-login', { username, password, role })
      data = response.data
    } catch (err) {
      // Real auth errors come back from the backend; only fall back to a local
      // dev token if the backend is unreachable so the UI can still be demoed
      // without `docker compose up`.
      if (err.response) throw err
      if (!username || !password) throw err
      data = {
        token: `dev-${role}-${Date.now()}`,
        username,
        name: prettyName(username),
        role: role.toUpperCase(),
        department: 'Computer Science',
        designation: defaultDesignation(role),
      }
    }

    const userData = {
      role: (data.role || role || 'faculty').toLowerCase(),
      username: data.username || username,
      name: data.name || prettyName(username),
      department: data.department || '—',
      designation: data.designation || defaultDesignation(role),
      employeeId: data.employeeId || `EMP-${(username || '').toUpperCase()}`,
      campus: data.campus || 'Lahore',
    }
    persistAuth(data.token, userData, remember)
    return data
  }

  const persistAuth = (jwt, userData, remember) => {
    const storage = remember ? localStorage : sessionStorage
    storage.setItem(TOKEN_KEY, jwt)
    storage.setItem(USER_KEY, JSON.stringify(userData))
    setToken(jwt)
    setUser(userData)
  }

  const logout = () => {
    clearStorage()
    setToken(null)
    setUser(null)
  }

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!token,
    role: user?.role || null,
    api,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

function prettyName(username) {
  if (!username) return 'User'
  return username
    .replace(/[._-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

function defaultDesignation(role) {
  const map = {
    faculty: 'Lecturer',
    hod: 'Head of Department',
    ao: 'Academic Officer',
    asst_ao: 'Assistant Academic Officer',
    manager: 'Manager (Academics)',
    asst_manager: 'Assistant Manager (Academics)',
    exam_office: 'Exam Office',
    finance: 'Finance Officer',
    it_admin: 'IT Administrator',
    registrar: 'Registrar',
    admissions: 'Admissions Officer',
    cao: 'Central Academic Office',
  }
  return map[role] || 'Staff'
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}

export default AuthContext

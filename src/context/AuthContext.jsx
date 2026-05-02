import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('flex_token') || sessionStorage.getItem('flex_token')
      const storedUser = localStorage.getItem('flex_user') || sessionStorage.getItem('flex_user')
      if (storedToken && storedUser && storedUser !== 'undefined') {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
      } else {
        localStorage.removeItem('flex_token')
        localStorage.removeItem('flex_user')
        sessionStorage.removeItem('flex_token')
        sessionStorage.removeItem('flex_user')
      }
    } catch {
      localStorage.removeItem('flex_token')
      localStorage.removeItem('flex_user')
      sessionStorage.removeItem('flex_token')
      sessionStorage.removeItem('flex_user')
    }
    setLoading(false)
  }, [])

  const login = async (rollNo, password, remember = false) => {
    let data
    try {
      const response = await api.post('/auth/login', {
        rollNumber: rollNo,
        password,
      })
      data = response.data
    } catch (err) {
      // Surface real auth errors (4xx) from the backend. If the backend is
      // unreachable (no response), fall back to a local dev token so the UI
      // can still be demoed without `docker compose up`.
      if (err.response) throw err
      if (!rollNo || !password) throw err
      data = {
        token: `dev-student-${Date.now()}`,
        rollNumber: rollNo,
        name: prettyName(rollNo),
        section: 'BSE-243A',
        degree: 'BS(SE)',
        campus: 'Lahore',
      }
    }

    const jwt = data.token
    const userData = {
      rollNo: data.rollNumber || data.rollNo,
      name: data.name,
      section: data.section,
      degree: data.degree,
      campus: data.campus,
    }

    const storage = remember ? localStorage : sessionStorage
    storage.setItem('flex_token', jwt)
    storage.setItem('flex_user', JSON.stringify(userData))
    setToken(jwt)
    setUser(userData)
    return data
  }

  const logout = () => {
    localStorage.removeItem('flex_token')
    localStorage.removeItem('flex_user')
    sessionStorage.removeItem('flex_token')
    sessionStorage.removeItem('flex_user')
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
    api,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

function prettyName(rollNo) {
  if (!rollNo) return 'Student'
  return `Student ${rollNo}`
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext

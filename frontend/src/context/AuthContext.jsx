import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('flex_token')
      const storedUser = localStorage.getItem('flex_user')
      if (storedToken && storedUser && storedUser !== 'undefined') {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
      } else {
        localStorage.removeItem('flex_token')
        localStorage.removeItem('flex_user')
      }
    } catch {
      localStorage.removeItem('flex_token')
      localStorage.removeItem('flex_user')
    }
    setLoading(false)
  }, [])

  const login = async (rollNo, password) => {
    const response = await api.post('/auth/login', { rollNo, password })
    const data = response.data
    const jwt = data.token
    const userData = { rollNo: data.rollNo, name: data.name }
    localStorage.setItem('flex_token', jwt)
    localStorage.setItem('flex_user', JSON.stringify(userData))
    setToken(jwt)
    setUser(userData)
    return data
  }

  const logout = () => {
    localStorage.removeItem('flex_token')
    localStorage.removeItem('flex_user')
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

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext

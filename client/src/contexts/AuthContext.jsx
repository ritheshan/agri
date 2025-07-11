import { createContext, useContext, useState, useEffect } from 'react'
import { setAuthToken } from '../utils/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in
    const savedToken = localStorage.getItem('agri_token')
    const savedUser = localStorage.getItem('agri_user')
    
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
      setAuthToken(savedToken) // Set the token for axios requests
    }
    setLoading(false)
  }, [])

  // Apply the token to axios when it changes
  useEffect(() => {
    setAuthToken(token)
  }, [token])

  const login = (userData, authToken) => {
    setUser(userData)
    setToken(authToken)
    localStorage.setItem('agri_token', authToken)
    localStorage.setItem('agri_user', JSON.stringify(userData))
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('agri_token')
    localStorage.removeItem('agri_user')
    setAuthToken(null) // Clear the token from axios
  }

  const updateUser = (updatedUser) => {
    setUser(updatedUser)
    localStorage.setItem('agri_user', JSON.stringify(updatedUser))
  }

  const value = {
    user,
    token,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user && !!token,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

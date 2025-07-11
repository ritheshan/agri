import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import axios from 'axios'
import LoadingAnimation from './LoadingAnimation'
import './Login.css'

const Login = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    phone: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register'
      const response = await axios.post(`http://localhost:8000${endpoint}`, formData)
      
      if (response.data.token) {
        // Use the AuthContext login function instead of directly setting localStorage
        login(response.data.user, response.data.token)
        navigate('/dashboard') // Redirect to dashboard after login
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page" style={{
      backgroundImage: "url('/iot-agriculture.jpg')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat"
    }}>
      <header className="login-header">
        <div className="header-content">
          <h1>🌾 AgriMaster</h1>
          <a href="/" className="back-home">← Back to Home</a>
        </div>
      </header>

      <div className="login-container">
        <div className="login-card" style={{ backdropFilter: "blur(10px)", backgroundColor: "rgba(255, 255, 255, 0.85)" }}>
          <div className="login-header-card">
            <h2>{isLogin ? 'Welcome Back!' : 'Join Our Community'}</h2>
            <p>{isLogin ? 'Sign in to your account' : 'Create your farmer account'}</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+1234567890"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              className="submit-btn bg-farm-green hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-105 w-full flex items-center justify-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isLogin ? 'Signing In...' : 'Creating Account...'}
                </>
              ) : (
                <>
                  {isLogin ? 'Sign In' : 'Create Account'} 
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {loading && (
            <LoadingAnimation type="growth" message={isLogin ? "Logging you into the farm..." : "Creating your farmer profile..."} />
          )}

          <div className="form-switch">
            <p>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button 
                type="button"
                className="switch-btn"
                onClick={() => {
                  setIsLogin(!isLogin)
                  setError('')
                  setFormData({ phone: '', password: '' })
                }}
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>

          <div className="auth-features">
            <h4>Join the Community to:</h4>
            <ul>
              <li>📝 Share your farming experiences</li>
              <li>💬 Ask questions and get help</li>
              <li>📚 Learn from other farmers</li>
              <li>🤝 Connect with fellow farmers</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login

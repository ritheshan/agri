import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { UserIcon, PhoneIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import axios from 'axios'

const Profile = () => {
  const { user, updateUser, logout } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [username, setUsername] = useState(user?.username || '')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user?.username) {
      setUsername(user.username)
    }
  }, [user])

  const handleSave = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('agri_token')
      const response = await axios.put('http://localhost:8000/auth/profile', {
        username
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      updateUser(response.data.user)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update profile:', error)
      alert('Failed to update profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setUsername(user?.username || '')
    setIsEditing(false)
  }

  const maskPhoneNumber = (phone) => {
    if (!phone) return ''
    return phone.slice(0, 2) + '****' + phone.slice(-4)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Profile</h1>
            <button
              onClick={logout}
              className="text-red-600 hover:text-red-700 font-medium"
            >
              Logout
            </button>
          </div>

          <div className="flex flex-col items-center mb-8">
            <div className="w-24 h-24 bg-farm-green rounded-full flex items-center justify-center mb-4">
              <UserIcon className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">
              {user?.username || 'Farmer'}
            </h2>
            <p className="text-gray-600">{maskPhoneNumber(user?.phone)}</p>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <UserIcon className="w-4 h-4 inline mr-2" />
                Username
              </label>
              <div className="flex items-center space-x-2">
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-farm-green focus:border-transparent"
                      placeholder="Enter your username"
                    />
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="text-farm-green hover:text-green-600 disabled:opacity-50"
                    >
                      <CheckIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleCancel}
                      className="text-red-500 hover:text-red-600"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-gray-800">
                      {username || 'Not set'}
                    </span>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-farm-green hover:text-green-600"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <PhoneIcon className="w-4 h-4 inline mr-2" />
                Phone Number
              </label>
              <div className="text-gray-800">{maskPhoneNumber(user?.phone)}</div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Member Since
              </label>
              <div className="text-gray-800">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Recently'}
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              <a
                href="/dashboard"
                className="bg-farm-green text-white p-4 rounded-lg text-center hover:bg-green-600 transition-colors"
              >
                <span className="block text-2xl mb-2">🌱</span>
                Dashboard
              </a>
              <a
                href="/community"
                className="bg-blue-500 text-white p-4 rounded-lg text-center hover:bg-blue-600 transition-colors"
              >
                <span className="block text-2xl mb-2">👥</span>
                Community
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile

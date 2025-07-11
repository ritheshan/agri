import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import axios from 'axios'
import WeatherSprayWidget from './WeatherSprayWidget'

const HomePage = () => {
  const { user, isAuthenticated, logout } = useAuth()
  const [weather, setWeather] = useState(null)
  const [location, setLocation] = useState(null)

  useEffect(() => {
    // Get user location and fetch weather
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setLocation({ lat: latitude, lon: longitude })
          fetchWeather(latitude, longitude)
        },
        (error) => {
          // Use default location (Delhi) if user denies location
          fetchWeather(28.6139, 77.2090)
        }
      )
    }
  }, [])

  const fetchWeather = async (lat, lon) => {
    try {
      const response = await axios.get(`http://localhost:8000/get_agri_data?lat=${lat}&lon=${lon}`)
      if (response.data.weather) {
        setWeather(response.data.weather)
      }
    } catch (error) {
      console.error('Error fetching weather:', error)
    }
  }

  const getWeatherIcon = (temp, rain, cloudCover = 0) => {
    if (rain > 0.5) return '🌧️'
    if (cloudCover > 70) return '☁️'
    if (temp > 30) return '☀️'
    if (temp > 20) return '🌤️'
    return '🌥️'
  }

  const getUserName = () => {
    if (!user) return '';
    // Prioritize displaying name instead of phone number
    return user.name || 'Farmer';
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <nav className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🌾</span>
              <h1 className="text-2xl font-bold text-farm-green">AgriMaster</h1>
            </div>
            <div className="hidden md:flex space-x-8">
              <Link to="/" className="text-farm-green font-medium">Home</Link>
              <Link to="/dashboard" className="text-gray-700 hover:text-farm-green transition-colors">Dashboard</Link>
              <Link to="/community" className="text-gray-700 hover:text-farm-green transition-colors">Community</Link>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex space-x-2">
                <Link 
                  to="/disease-detection" 
                  className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-all transform hover:scale-105 flex items-center"
                >
                  <span className="mr-1">🦠</span>
                  Disease Detection
                </Link>
                <Link 
                  to="/profit-calculator" 
                  className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-all transform hover:scale-105 flex items-center"
                >
                  <span className="mr-1">💰</span>
                  Profit Calculator
                </Link>
              </div>
              
              {isAuthenticated ? (
                <div className="flex items-center space-x-3">
                  <span className="text-gray-700 hidden md:inline-block">Welcome, {getUserName()}</span>
                  <Link to="/profile" className="text-farm-green hover:text-green-600 transition-colors">
                    Profile
                  </Link>
                  <button
                    onClick={logout}
                    className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link to="/login" className="bg-farm-green text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors">
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <section className="relative">
        <div className="max-w-7xl mx-auto px-4 pt-12 pb-6">
          {weather && (
            <div className="bg-white rounded-xl shadow-md p-4 mb-8 max-w-3xl mx-auto">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Current Weather Status</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex items-center space-x-2 bg-gray-50 p-3 rounded-lg">
                  <span className="text-2xl">{getWeatherIcon(weather.temp, weather.rain)}</span>
                  <div>
                    <div className="font-semibold text-gray-800">{weather.temp}°C</div>
                    <div className="text-xs text-gray-600">Temp</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 bg-gray-50 p-3 rounded-lg">
                  <span className="text-2xl">💧</span>
                  <div>
                    <div className="font-semibold text-gray-800">{weather.humidity}%</div>
                    <div className="text-xs text-gray-600">Humidity</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 bg-gray-50 p-3 rounded-lg">
                  <span className="text-2xl">🌧️</span>
                  <div>
                    <div className="font-semibold text-gray-800">{weather.rain}mm</div>
                    <div className="text-xs text-gray-600">Rain</div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 text-center md:text-left mb-10 md:mb-0 md:pr-10">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 mb-6">
                Smart Agriculture
                <span className="block text-farm-green">Made Simple</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-600 mb-8">
                Harness the power of AI and data analytics to optimize your farming operations, 
                predict yields, and make informed decisions for better harvests.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Link 
                  to="/dashboard" 
                  className="bg-farm-green text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-green-600 transition-all transform hover:scale-105 shadow-lg"
                >
                  Start Farming Smart 🚀
                </Link>
                <a 
                  href="#features" 
                  className="bg-white text-farm-green border-2 border-farm-green px-8 py-4 rounded-lg text-lg font-semibold hover:bg-farm-green hover:text-white transition-all transform hover:scale-105 shadow-lg"
                >
                  Explore Features
                </a>
              </div>
            </div>
            <div className="md:w-1/2">
              <img 
                src="/farm-hero.jpg" 
                alt="Smart Farming" 
                className="rounded-xl shadow-xl" 
              />
            </div>
          </div>
        </div>
      </section>

      <WeatherSprayWidget />

      <section id="features" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Our Smart Agriculture Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-green-50 p-6 rounded-xl shadow-md transform transition hover:scale-105">
              <div className="text-4xl mb-4">🌱</div>
              <h3 className="text-xl font-bold mb-2">Crop Recommendations</h3>
              <p className="text-gray-600">Get AI-powered suggestions for optimal crops based on your soil conditions, climate, and market trends.</p>
              <Link to="/dashboard" className="text-farm-green font-semibold mt-4 inline-block hover:underline">
                Explore Dashboard →
              </Link>
            </div>
            
            <div className="bg-green-50 p-6 rounded-xl shadow-md transform transition hover:scale-105">
              <div className="text-4xl mb-4">🦠</div>
              <h3 className="text-xl font-bold mb-2">Disease Detection</h3>
              <p className="text-gray-600">Identify plant diseases early with our advanced image recognition technology to prevent crop losses.</p>
              <Link to="/disease-detection" className="text-farm-green font-semibold mt-4 inline-block hover:underline">
                Detect Diseases →
              </Link>
            </div>
            
            <div className="bg-green-50 p-6 rounded-xl shadow-md transform transition hover:scale-105">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-bold mb-2">Profit Calculator</h3>
              <p className="text-gray-600">Plan your farming season with our interactive profit calculator that estimates returns based on real market data.</p>
              <Link to="/profit-calculator" className="text-farm-green font-semibold mt-4 inline-block hover:underline">
                Calculate Profits →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-8 md:mb-0 md:pr-8">
              <h2 className="text-3xl font-bold mb-6">Join Our Farming Community</h2>
              <p className="text-lg text-gray-600 mb-6">
                Connect with fellow farmers, share experiences, ask questions, and learn from experts. 
                Our community is a space for knowledge sharing and support.
              </p>
              <Link 
                to="/community" 
                className="bg-farm-green text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 transition-all inline-block"
              >
                Join the Community →
              </Link>
            </div>
            <div className="md:w-1/2 grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-md">
                <div className="text-3xl mb-2">📝</div>
                <h4 className="font-semibold">Share Knowledge</h4>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md">
                <div className="text-3xl mb-2">❓</div>
                <h4 className="font-semibold">Ask Questions</h4>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md">
                <div className="text-3xl mb-2">👨‍🌾</div>
                <h4 className="font-semibold">Expert Advice</h4>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md">
                <div className="text-3xl mb-2">🤝</div>
                <h4 className="font-semibold">Support Network</h4>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-6 md:mb-0">
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-2xl">🌾</span>
                <h3 className="text-xl font-bold">AgriMaster</h3>
              </div>
              <p className="text-gray-400 max-w-sm">
                Empowering farmers with smart technology for better yields and sustainable farming practices.
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h4 className="font-semibold mb-3">Features</h4>
                <ul className="space-y-2 text-gray-400">
                  <li><Link to="/dashboard" className="hover:text-white">Dashboard</Link></li>
                  <li><Link to="/disease-detection" className="hover:text-white">Disease Detection</Link></li>
                  <li><Link to="/profit-calculator" className="hover:text-white">Profit Calculator</Link></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3">Community</h4>
                <ul className="space-y-2 text-gray-400">
                  <li><Link to="/community" className="hover:text-white">Forums</Link></li>
                  <li><a href="#" className="hover:text-white">Knowledge Base</a></li>
                  <li><a href="#" className="hover:text-white">Events</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3">Support</h4>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="#" className="hover:text-white">Help Center</a></li>
                  <li><a href="#" className="hover:text-white">Contact Us</a></li>
                  <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-700 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} AgriMaster. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default HomePage

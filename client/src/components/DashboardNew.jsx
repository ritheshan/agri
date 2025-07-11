import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import YieldPredictionNew from './features/YieldPredictionNew'
import FertilizerRecommendationNew from './features/FertilizerRecommendationNew'
import StressPredictionNew from './features/StressPredictionNew'
import CropRecommendationNew from './features/CropRecommendationNew'
import WeatherInfoNew from './features/WeatherInfoNew'
import LoadingAnimation from './LoadingAnimation'
import 'leaflet/dist/leaflet.css'

// Fix leaflet default markers
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

const DashboardNew = () => {
  const { user, isAuthenticated, logout } = useAuth()
  const [selectedCrop, setSelectedCrop] = useState('')
  const [fieldLocation, setFieldLocation] = useState(null)
  const [activeFeature, setActiveFeature] = useState('')
  const [weatherData, setWeatherData] = useState(null)
  const [loadingWeather, setLoadingWeather] = useState(false)

  const crops = [
    { id: 'potato', name: 'Potato', icon: '🥔', available: true },
    { id: 'corn', name: 'Corn', icon: '🌽', available: false },
    { id: 'wheat', name: 'Wheat', icon: '🌾', available: false },
    { id: 'tomato', name: 'Tomato', icon: '🍅', available: false },
    { id: 'rice', name: 'Rice', icon: '🌾', available: false },
  ]

  const features = [
    { id: 'yield', name: 'Yield Prediction', icon: '📈', color: 'bg-green-500' },
    { id: 'fertilizer', name: 'Fertilizer Recommendation', icon: '🧪', color: 'bg-yellow-500' },
    { id: 'stress', name: 'Stress Analysis', icon: '🔬', color: 'bg-red-500' },
    { id: 'crop', name: 'Crop Recommendation', icon: '🌾', color: 'bg-emerald-500' },
  ]

  // Map click handler component
  const LocationMarker = () => {
    useMapEvents({
      click(e) {
        setFieldLocation({
          lat: e.latlng.lat,
          lng: e.latlng.lng
        })
        fetchWeatherData(e.latlng.lat, e.latlng.lng)
      },
    })

    return fieldLocation ? (
      <Marker position={[fieldLocation.lat, fieldLocation.lng]} />
    ) : null
  }

  const fetchWeatherData = async (lat, lng) => {
    setLoadingWeather(true)
    try {
      const response = await axios.get(`http://localhost:8000/get_agri_data?lat=${lat}&lon=${lng}`)
      setWeatherData(response.data.weather)
    } catch (error) {
      console.error('Failed to fetch weather data:', error)
    } finally {
      setLoadingWeather(false)
    }
  }

  const renderFeatureContent = () => {
    if (!selectedCrop || !fieldLocation) return null

    switch (activeFeature) {
      case 'yield':
        return <YieldPredictionNew position={fieldLocation} weatherData={weatherData} />
      case 'fertilizer':
        return <FertilizerRecommendationNew position={fieldLocation} weatherData={weatherData} />
      case 'stress':
        return <StressPredictionNew position={fieldLocation} weatherData={weatherData} />
      case 'crop':
        return <CropRecommendationNew position={fieldLocation} weatherData={weatherData} />
      default:
        return (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🌱</div>
            <h3 className="text-2xl font-semibold text-gray-700 mb-2">Select a Feature</h3>
            <p className="text-gray-500">Choose from the features above to get started with your analysis</p>
          </div>
        )
    }
  }

  const getUserName = () => {
    if (!user) return '';
    // Prioritize displaying name instead of phone number
    return user.name || 'Farmer';
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center space-x-2">
                <span className="text-2xl">🌾</span>
                <h1 className="text-2xl font-bold text-farm-green">AgriMaster</h1>
              </Link>
              
              <nav className="hidden md:flex items-center space-x-6 ml-8">
                <Link to="/" className="text-gray-600 hover:text-farm-green transition-colors">Home</Link>
                <Link to="/dashboard" className="text-farm-green font-medium">Dashboard</Link>
                <Link to="/community" className="text-gray-600 hover:text-farm-green transition-colors">Community</Link>
              </nav>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex space-x-2">
                <Link 
                  to="/disease-detection" 
                  className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-all transform hover:scale-105 flex items-center"
                >
                  <span className="mr-2">🦠</span>
                  Disease Detection
                </Link>
                <Link 
                  to="/profit-calculator" 
                  className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-all transform hover:scale-105 flex items-center"
                >
                  <span className="mr-2">💰</span>
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
      </div>

      <div className="max-w-full mx-auto p-4 lg:p-6">
        <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-xl shadow-lg p-8 mb-6 text-center">
          <h2 className="text-4xl font-bold mb-2">
             Unleash the Power of AI Prediction
          </h2>
          <p className="text-xl text-green-100">
            Eliminate diseases, maximize yields, and revolutionize your farming with intelligent insights
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <span className="mr-2">🌱</span>
            Step 1: Select Your Crop
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {crops.map((crop) => (
              <button
                key={crop.id}
                onClick={() => crop.available && setSelectedCrop(crop.id)}
                disabled={!crop.available}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedCrop === crop.id
                    ? 'border-farm-green bg-green-50 transform scale-105'
                    : crop.available
                    ? 'border-gray-200 hover:border-farm-green hover:bg-green-50'
                    : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="text-3xl mb-2">{crop.icon}</div>
                <div className="font-medium text-gray-800">{crop.name}</div>
                {!crop.available && (
                  <div className="text-xs text-gray-500 mt-1">Coming Soon</div>
                )}
              </button>
            ))}
          </div>
        </div>

        {selectedCrop && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <span className="mr-2">📍</span>
              Step 2: Select Your Field Location
            </h2>
            <p className="text-gray-600 mb-4">Click on the map to select your field location</p>
            
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="h-64 rounded-lg overflow-hidden border">
                  <MapContainer
                    center={[20.5937, 78.9629]}
                    zoom={5}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <LocationMarker />
                  </MapContainer>
                </div>
                {fieldLocation && (
                  <div className="mt-3 text-sm text-gray-600 bg-green-50 p-3 rounded-lg">
                    <strong>Selected Location:</strong> {fieldLocation.lat.toFixed(4)}, {fieldLocation.lng.toFixed(4)}
                  </div>
                )}
              </div>
              
              <div className="lg:col-span-1">
                {loadingWeather ? (
                  <LoadingAnimation type="weather" message="Fetching weather data..." />
                ) : weatherData ? (
                  <WeatherInfoNew weatherData={weatherData} />
                ) : (
                  <div className="bg-gray-50 rounded-lg p-6 text-center">
                    <div className="text-4xl mb-2">🌤️</div>
                    <p className="text-gray-500">Select a location to view weather data</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {selectedCrop && fieldLocation && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
              <span className="mr-2">🔧</span>
              Step 3: Choose Analysis Tool
            </h2>
            
            <div className="flex flex-wrap gap-2 mb-6 border-b">
              {features.map((feature) => (
                <button
                  key={feature.id}
                  onClick={() => setActiveFeature(feature.id)}
                  className={`px-4 py-3 rounded-t-lg font-medium transition-all flex items-center space-x-2 ${
                    activeFeature === feature.id
                      ? 'bg-farm-green text-white border-b-2 border-farm-green'
                      : 'text-gray-600 hover:text-farm-green hover:bg-green-50'
                  }`}
                >
                  <span>{feature.icon}</span>
                  <span className="hidden sm:inline">{feature.name}</span>
                </button>
              ))}
            </div>

            <div className="min-h-96">
              {renderFeatureContent()}
            </div>
          </div>
        )}

        {!selectedCrop && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-8 text-center">
            <div className="text-6xl mb-4">🚀</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Welcome to Smart Farming!</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Get started by selecting your crop type above. Our AI-powered tools will help you optimize 
              your farming operations with personalized recommendations based on your specific conditions.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default DashboardNew

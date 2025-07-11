import { useState } from 'react'
import axios from 'axios'
import LoadingAnimation from '../LoadingAnimation'

const CropRecommendationNew = ({ position, weatherData }) => {
  const [formData, setFormData] = useState({
    nitrogen: 50,
    phosphorus: 50,
    potassium: 50,
    ph: 6.5,
    rainfall: 100,
    temperature: 25,
    humidity: 60
  })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: parseFloat(value)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await axios.post('http://localhost:8000/predict_crop', {
        ...formData,
        lat: position.lat,
        lon: position.lng
      })

      setResult(response.data)
    } catch (err) {
      setError('Failed to get crop recommendation. Please try again.')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl">
        <h3 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
          <span className="mr-3">🌾</span>
          Crop Recommendation
        </h3>
        <p className="text-gray-600">
          Get personalized crop recommendations based on your soil conditions and climate data
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="mr-2">🧪</span>
              Soil Nutrients
            </h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nitrogen (N): {formData.nitrogen} kg/ha
                </label>
                <input
                  type="range"
                  min="0"
                  max="140"
                  value={formData.nitrogen}
                  onChange={(e) => handleInputChange('nitrogen', e.target.value)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-green"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0</span>
                  <span>140</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phosphorus (P): {formData.phosphorus} kg/ha
                </label>
                <input
                  type="range"
                  min="5"
                  max="145"
                  value={formData.phosphorus}
                  onChange={(e) => handleInputChange('phosphorus', e.target.value)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-green"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>5</span>
                  <span>145</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Potassium (K): {formData.potassium} kg/ha
                </label>
                <input
                  type="range"
                  min="5"
                  max="205"
                  value={formData.potassium}
                  onChange={(e) => handleInputChange('potassium', e.target.value)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-green"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>5</span>
                  <span>205</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  pH Level: {formData.ph}
                </label>
                <input
                  type="range"
                  min="3.5"
                  max="9.9"
                  step="0.1"
                  value={formData.ph}
                  onChange={(e) => handleInputChange('ph', e.target.value)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-green"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>3.5</span>
                  <span>9.9</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="mr-2">🌤️</span>
              Climate Conditions
            </h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temperature: {formData.temperature}°C
                </label>
                <input
                  type="range"
                  min="8"
                  max="45"
                  value={formData.temperature}
                  onChange={(e) => handleInputChange('temperature', e.target.value)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-green"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>8°C</span>
                  <span>45°C</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Humidity: {formData.humidity}%
                </label>
                <input
                  type="range"
                  min="14"
                  max="100"
                  value={formData.humidity}
                  onChange={(e) => handleInputChange('humidity', e.target.value)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-green"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>14%</span>
                  <span>100%</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rainfall: {formData.rainfall}mm
                </label>
                <input
                  type="range"
                  min="20"
                  max="300"
                  value={formData.rainfall}
                  onChange={(e) => handleInputChange('rainfall', e.target.value)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-green"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>20mm</span>
                  <span>300mm</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {weatherData && (
          <div className="bg-blue-50 p-6 rounded-xl">
            <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="mr-2">🌡️</span>
              Current Weather Conditions
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{weatherData.temperature}°C</div>
                <div className="text-sm text-gray-600">Temperature</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{weatherData.humidity}%</div>
                <div className="text-sm text-gray-600">Humidity</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{weatherData.wind_speed} m/s</div>
                <div className="text-sm text-gray-600">Wind Speed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{weatherData.pressure} hPa</div>
                <div className="text-sm text-gray-600">Pressure</div>
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-farm-green text-white py-3 px-6 rounded-xl font-semibold hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <LoadingAnimation type="spinner" size="sm" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <span>🔍</span>
              <span>Get Crop Recommendation</span>
            </>
          )}
        </button>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center">
            <span className="text-red-500 mr-2">❌</span>
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {result && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <h4 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
            <span className="mr-2">🌱</span>
            Recommended Crop
          </h4>
          <div className="bg-white p-4 rounded-lg">
            <div className="text-center">
              <div className="text-4xl mb-2">🌾</div>
              <div className="text-2xl font-bold text-green-600 capitalize">{result.crop}</div>
              <div className="text-gray-600 mt-2">
                Best suited for your soil and climate conditions
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CropRecommendationNew

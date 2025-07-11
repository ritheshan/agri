import { useState } from 'react'
import axios from 'axios'
import LoadingAnimation from '../LoadingAnimation'

const YieldPredictionNew = ({ position, weatherData }) => {
  const [formData, setFormData] = useState({
    ozone: 50,
    soil: 75
  })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await axios.get('http://localhost:8000/predict_yield', {
        params: {
          lat: position.lat,
          lon: position.lng,
          ozone: formData.ozone,
          soil: formData.soil
        }
      })

      setResult(response.data.result)
    } catch (err) {
      setError('Failed to predict yield. Please try again.')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl">
        <h3 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
          <span className="mr-3">📈</span>
          Potato Yield Prediction
        </h3>
        <p className="text-gray-600">
          Predict your potato yield based on environmental conditions and soil quality using AI analytics.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Ozone Level (μg/m³)
            </label>
            <div className="space-y-4">
              <input
                type="range"
                min="0"
                max="200"
                value={formData.ozone}
                onChange={(e) => handleInputChange('ozone', e.target.value)}
                className="w-full h-3 bg-gradient-to-r from-green-200 to-green-500 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-sm text-gray-500">
                <span>0</span>
                <span className="font-semibold text-green-600">{formData.ozone} μg/m³</span>
                <span>200</span>
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-500">
              Optimal range: 20-80 μg/m³
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Soil Quality Index (0-100)
            </label>
            <div className="space-y-4">
              <input
                type="range"
                min="0"
                max="100"
                value={formData.soil}
                onChange={(e) => handleInputChange('soil', e.target.value)}
                className="w-full h-3 bg-gradient-to-r from-yellow-200 to-green-500 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-sm text-gray-500">
                <span>Poor (0)</span>
                <span className="font-semibold text-green-600">{formData.soil}/100</span>
                <span>Excellent (100)</span>
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-500">
              {formData.soil < 30 ? 'Poor soil quality' : 
               formData.soil < 70 ? 'Good soil quality' : 'Excellent soil quality'}
            </div>
          </div>
        </div>

        {weatherData && (
          <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
              <span className="mr-2">🌤️</span>
              Current Weather Conditions
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-600">{weatherData.temp}°C</div>
                <div className="text-gray-600">Temperature</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-600">{weatherData.rain}mm</div>
                <div className="text-gray-600">Rainfall</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-600">{weatherData.humidity}%</div>
                <div className="text-gray-600">Humidity</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-600">{weatherData.windSpeed} km/h</div>
                <div className="text-gray-600">Wind Speed</div>
              </div>
            </div>
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          {loading ? '🔄 Analyzing...' : '📊 Predict Yield'}
        </button>
      </form>

      {loading && (
        <LoadingAnimation type="harvest" message="Analyzing yield potential..." />
      )}

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
          <h4 className="font-semibold text-green-800 mb-3 flex items-center">
            <span className="mr-2">🎯</span>
            Prediction Result
          </h4>
          <div className="text-green-700 text-lg font-medium">{result}</div>
          
          <div className="mt-4 p-4 bg-white rounded-lg">
            <h5 className="font-semibold text-gray-800 mb-2">💡 Recommendations</h5>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Monitor soil moisture levels regularly</li>
              <li>• Apply fertilizers based on soil test results</li>
              <li>• Consider weather patterns for optimal harvesting</li>
              <li>• Implement proper irrigation scheduling</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

export default YieldPredictionNew

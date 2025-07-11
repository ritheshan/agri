import { useState } from 'react'
import axios from 'axios'
import LoadingAnimation from '../LoadingAnimation'

const FertilizerRecommendationNew = ({ position, weatherData }) => {
  const [formData, setFormData] = useState({
    ozone: 50,
    soil: 75,
    ph: 6.5,
    stage: 'vegetative'
  })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const growthStages = [
    { value: 'vegetative', label: 'Vegetative Stage', icon: '🌱' },
    { value: 'flowering', label: 'Flowering Stage', icon: '🌸' },
    { value: 'fruiting', label: 'Fruiting Stage', icon: '🍅' },
    { value: 'maturity', label: 'Maturity Stage', icon: '🌾' }
  ]

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
      const response = await axios.get('http://localhost:8000/recommend_fertilizer', {
        params: {
          lat: position.lat,
          lon: position.lng,
          ozone: formData.ozone,
          soil: formData.soil,
          ph: formData.ph,
          stage: formData.stage
        }
      })

      setResult(response.data.result)
    } catch (err) {
      setError('Failed to get fertilizer recommendation. Please try again.')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const getPHColor = (ph) => {
    if (ph < 6) return 'text-red-600'
    if (ph > 8) return 'text-purple-600'
    return 'text-green-600'
  }

  const getPHStatus = (ph) => {
    if (ph < 6) return 'Acidic'
    if (ph > 8) return 'Alkaline'
    return 'Optimal'
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-xl">
        <h3 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
          <span className="mr-3">🧪</span>
          Fertilizer Recommendation
        </h3>
        <p className="text-gray-600">
          Get personalized fertilizer recommendations based on soil conditions and crop growth stage.
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
                className="w-full h-3 bg-gradient-to-r from-blue-200 to-blue-500 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-sm text-gray-500">
                <span>0</span>
                <span className="font-semibold text-blue-600">{formData.ozone} μg/m³</span>
                <span>200</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Soil Quality Index
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
                <span>Poor</span>
                <span className="font-semibold text-green-600">{formData.soil}/100</span>
                <span>Excellent</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Soil pH Level
          </label>
          <div className="space-y-4">
            <input
              type="range"
              min="4"
              max="10"
              step="0.1"
              value={formData.ph}
              onChange={(e) => handleInputChange('ph', e.target.value)}
              className="w-full h-3 bg-gradient-to-r from-red-300 via-green-300 to-purple-300 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-sm text-gray-500">
              <span>Acidic (4)</span>
              <span className={`font-semibold ${getPHColor(formData.ph)}`}>
                {formData.ph} ({getPHStatus(formData.ph)})
              </span>
              <span>Alkaline (10)</span>
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-500">
            Optimal pH for potatoes: 6.0 - 7.0
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <label className="block text-sm font-semibold text-gray-700 mb-4">
            Current Growth Stage
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {growthStages.map((stage) => (
              <button
                key={stage.value}
                type="button"
                onClick={() => handleInputChange('stage', stage.value)}
                className={`p-4 rounded-lg border-2 transition-all text-center ${
                  formData.stage === stage.value
                    ? 'border-yellow-500 bg-yellow-50 transform scale-105'
                    : 'border-gray-200 hover:border-yellow-300 hover:bg-yellow-50'
                }`}
              >
                <div className="text-2xl mb-2">{stage.icon}</div>
                <div className="text-sm font-medium text-gray-800">{stage.label}</div>
              </button>
            ))}
          </div>
        </div>

        {weatherData && (
          <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
              <span className="mr-2">🌤️</span>
              Environmental Conditions
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
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
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-600">{weatherData.pressure} hPa</div>
                <div className="text-gray-600">Pressure</div>
              </div>
            </div>
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-yellow-600 hover:to-orange-600 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          {loading ? '🔄 Analyzing...' : '🧪 Get Recommendation'}
        </button>
      </form>

      {loading && (
        <LoadingAnimation type="growth" message="Finding the best fertilizer for your crops..." />
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
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <h4 className="font-semibold text-yellow-800 mb-3 flex items-center">
            <span className="mr-2">🎯</span>
            Fertilizer Recommendation
          </h4>
          <div className="text-yellow-700 text-lg font-medium mb-4">{result}</div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-white rounded-lg">
              <h5 className="font-semibold text-gray-800 mb-2">📋 Application Guidelines</h5>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Apply during early morning or evening</li>
                <li>• Water thoroughly after application</li>
                <li>• Follow manufacturer's dilution ratios</li>
                <li>• Monitor plant response for 1-2 weeks</li>
              </ul>
            </div>
            
            <div className="p-4 bg-white rounded-lg">
              <h5 className="font-semibold text-gray-800 mb-2">⚠️ Safety Tips</h5>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Wear protective equipment</li>
                <li>• Store in cool, dry place</li>
                <li>• Keep away from children and pets</li>
                <li>• Read label instructions carefully</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FertilizerRecommendationNew

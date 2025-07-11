import { useState } from 'react'
import axios from 'axios'
import LoadingAnimation from '../LoadingAnimation'

const StressPredictionNew = ({ position, weatherData }) => {
  const [formData, setFormData] = useState({
    ozone: 50,
    temperature: weatherData?.temp || 25,
    humidity: weatherData?.humidity || 65,
    color: 'green',
    symptom: 'none'
  })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const colorOptions = [
    { value: 'green', label: 'Green (Healthy)', color: 'bg-green-500', icon: '🟢' },
    { value: 'yellow', label: 'Yellow (Mild Stress)', color: 'bg-yellow-500', icon: '🟡' },
    { value: 'brown', label: 'Brown (Moderate Stress)', color: 'bg-yellow-700', icon: '🟤' },
    { value: 'red', label: 'Red (Severe Stress)', color: 'bg-red-500', icon: '🔴' }
  ]

  const symptomOptions = [
    { value: 'none', label: 'No Symptoms', icon: '✅' },
    { value: 'wilting', label: 'Wilting', icon: '🥀' },
    { value: 'yellowing', label: 'Leaf Yellowing', icon: '🍂' },
    { value: 'browning', label: 'Leaf Browning', icon: '🍁' },
    { value: 'spots', label: 'Leaf Spots', icon: '🔴' },
    { value: 'curling', label: 'Leaf Curling', icon: '🌀' }
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
      const response = await axios.get('http://localhost:8000/predict_stress', {
        params: {
          lat: position.lat,
          lon: position.lng,
          ozone: formData.ozone,
          temp: formData.temperature,
          humidity: formData.humidity,
          color: formData.color,
          symptom: formData.symptom
        }
      })

      setResult(response.data)
    } catch (err) {
      setError('Failed to predict stress level. Please try again.')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStressLevel = (result) => {
    if (result?.result?.includes('Low')) return { level: 'Low', color: 'text-green-600', bg: 'bg-green-50' }
    if (result?.result?.includes('Medium')) return { level: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-50' }
    if (result?.result?.includes('High')) return { level: 'High', color: 'text-red-600', bg: 'bg-red-50' }
    return { level: 'Unknown', color: 'text-gray-600', bg: 'bg-gray-50' }
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-red-50 to-orange-50 p-6 rounded-xl">
        <h3 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
          <span className="mr-3">🔬</span>
          Plant Stress Analysis
        </h3>
        <p className="text-gray-600">
          Monitor and analyze crop stress levels based on environmental conditions and visible symptoms.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-gray-800">Environmental Conditions</h4>
            
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
                  className="w-full h-3 bg-gradient-to-r from-purple-200 to-purple-500 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>0</span>
                  <span className="font-semibold text-purple-600">{formData.ozone} μg/m³</span>
                  <span>200</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Temperature (°C)
              </label>
              <div className="space-y-4">
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={formData.temperature}
                  onChange={(e) => handleInputChange('temperature', e.target.value)}
                  className="w-full h-3 bg-gradient-to-r from-blue-200 via-red-300 to-red-500 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>0°C</span>
                  <span className="font-semibold text-red-600">{formData.temperature}°C</span>
                  <span>50°C</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Humidity (%)
              </label>
              <div className="space-y-4">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.humidity}
                  onChange={(e) => handleInputChange('humidity', e.target.value)}
                  className="w-full h-3 bg-gradient-to-r from-yellow-200 to-blue-500 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>0%</span>
                  <span className="font-semibold text-blue-600">{formData.humidity}%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-gray-800">Visual Assessment</h4>
            
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <label className="block text-sm font-semibold text-gray-700 mb-4">
                Predominant Leaf Color
              </label>
              <div className="grid grid-cols-2 gap-3">
                {colorOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleInputChange('color', option.value)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      formData.color === option.value
                        ? 'border-gray-800 bg-gray-50 transform scale-105'
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{option.icon}</span>
                      <div>
                        <div className="font-medium text-gray-800">{option.label.split(' (')[0]}</div>
                        <div className="text-xs text-gray-500">{option.label.split(' (')[1]?.replace(')', '')}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <label className="block text-sm font-semibold text-gray-700 mb-4">
                Visible Symptoms
              </label>
              <div className="grid grid-cols-2 gap-3">
                {symptomOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleInputChange('symptom', option.value)}
                    className={`p-3 rounded-lg border-2 transition-all text-center ${
                      formData.symptom === option.value
                        ? 'border-red-500 bg-red-50 transform scale-105'
                        : 'border-gray-200 hover:border-red-300'
                    }`}
                  >
                    <div className="text-xl mb-1">{option.icon}</div>
                    <div className="text-sm font-medium text-gray-800">{option.label}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {weatherData && (
          <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
              <span className="mr-2">🌤️</span>
              Current Environmental Data
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center p-3 bg-white rounded-lg">
                <div className="text-lg font-semibold text-red-600">{weatherData.temp}°C</div>
                <div className="text-gray-600">Temperature</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg">
                <div className="text-lg font-semibold text-blue-600">{weatherData.humidity}%</div>
                <div className="text-gray-600">Humidity</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg">
                <div className="text-lg font-semibold text-green-600">{weatherData.windSpeed} km/h</div>
                <div className="text-gray-600">Wind Speed</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg">
                <div className="text-lg font-semibold text-purple-600">{weatherData.pressure} hPa</div>
                <div className="text-gray-600">Pressure</div>
              </div>
            </div>
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-red-600 hover:to-orange-600 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          {loading ? '🔄 Analyzing...' : '🔬 Analyze Stress Level'}
        </button>
      </form>

      {loading && (
        <LoadingAnimation type="analysis" message="Analyzing plant stress indicators..." />
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
        <div className={`${getStressLevel(result).bg} border border-gray-200 rounded-xl p-6`}>
          <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
            <span className="mr-2">📊</span>
            Stress Analysis Results
          </h4>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-lg">
              <h5 className="font-semibold text-gray-800 mb-2">Stress Level</h5>
              <div className={`text-2xl font-bold ${getStressLevel(result).color} mb-2`}>
                {getStressLevel(result).level}
              </div>
              <div className="text-gray-700">{result.result}</div>
            </div>
            
            <div className="bg-white p-4 rounded-lg">
              <h5 className="font-semibold text-gray-800 mb-2">Analysis</h5>
              <div className="text-gray-700 text-sm">
                {result.explanation || 'Based on the environmental conditions and visual symptoms, the stress level has been determined.'}
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-white rounded-lg">
            <h5 className="font-semibold text-gray-800 mb-3">🔧 Recommended Actions</h5>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <h6 className="font-medium text-gray-800 mb-2">Immediate Steps</h6>
                <ul className="text-gray-600 space-y-1">
                  {getStressLevel(result).level === 'High' && (
                    <>
                      <li>• Provide immediate irrigation if soil is dry</li>
                      <li>• Apply shade cloth during peak sun hours</li>
                      <li>• Check for pest infestations</li>
                    </>
                  )}
                  {getStressLevel(result).level === 'Medium' && (
                    <>
                      <li>• Monitor irrigation schedule</li>
                      <li>• Check nutrient levels</li>
                      <li>• Improve air circulation</li>
                    </>
                  )}
                  {getStressLevel(result).level === 'Low' && (
                    <>
                      <li>• Continue current care routine</li>
                      <li>• Regular monitoring</li>
                      <li>• Preventive measures</li>
                    </>
                  )}
                </ul>
              </div>
              <div>
                <h6 className="font-medium text-gray-800 mb-2">Long-term Solutions</h6>
                <ul className="text-gray-600 space-y-1">
                  <li>• Improve soil drainage system</li>
                  <li>• Install automated irrigation</li>
                  <li>• Regular soil testing</li>
                  <li>• Implement integrated pest management</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StressPredictionNew

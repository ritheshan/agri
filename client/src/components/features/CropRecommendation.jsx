import { useState } from 'react'
import axios from 'axios'

const CropRecommendation = ({ position, weatherData }) => {
  const [formData, setFormData] = useState({
    N: '',
    P: '',
    K: '',
    temperature: '',
    humidity: '',
    ph: '',
    rainfall: '',
    ozone: ''
  })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await axios.get('http://localhost:8000/recommend_crop', {
        params: {
          N: parseFloat(formData.N),
          P: parseFloat(formData.P),
          K: parseFloat(formData.K),
          temperature: parseFloat(formData.temperature),
          humidity: parseFloat(formData.humidity),
          ph: parseFloat(formData.ph),
          rainfall: parseFloat(formData.rainfall),
          ozone: parseFloat(formData.ozone)
        }
      })

      if (response.data.recommended_crop) {
        setResult(`Recommended Crop: ${response.data.recommended_crop}`)
      } else {
        setResult(response.data.message || 'No suitable crop found for these conditions.')
      }
    } catch (err) {
      setError('Failed to get crop recommendation. Please try again.')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Auto-fill weather data if available
  const fillWeatherData = () => {
    if (weatherData) {
      setFormData(prev => ({
        ...prev,
        temperature: weatherData.temp || '',
        humidity: weatherData.humidity || '',
        rainfall: weatherData.rain || ''
      }))
    }
  }

  return (
    <div className="crop-recommendation">
      <h2>🌱 Crop Recommendation</h2>
      <p>Get recommendations for the best crops to grow based on soil nutrients and environmental conditions.</p>
      
      <form onSubmit={handleSubmit} className="feature-form">
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="N">Nitrogen (N) content (kg/ha)</label>
            <input
              type="number"
              id="N"
              name="N"
              value={formData.N}
              onChange={handleInputChange}
              step="0.1"
              required
              placeholder="Enter nitrogen content"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="P">Phosphorus (P) content (kg/ha)</label>
            <input
              type="number"
              id="P"
              name="P"
              value={formData.P}
              onChange={handleInputChange}
              step="0.1"
              required
              placeholder="Enter phosphorus content"
            />
          </div>

          <div className="form-group">
            <label htmlFor="K">Potassium (K) content (kg/ha)</label>
            <input
              type="number"
              id="K"
              name="K"
              value={formData.K}
              onChange={handleInputChange}
              step="0.1"
              required
              placeholder="Enter potassium content"
            />
          </div>

          <div className="form-group">
            <label htmlFor="temperature">Temperature (°C)</label>
            <input
              type="number"
              id="temperature"
              name="temperature"
              value={formData.temperature}
              onChange={handleInputChange}
              step="0.1"
              required
              placeholder="Enter temperature"
            />
          </div>

          <div className="form-group">
            <label htmlFor="humidity">Humidity (%)</label>
            <input
              type="number"
              id="humidity"
              name="humidity"
              value={formData.humidity}
              onChange={handleInputChange}
              min="0"
              max="100"
              step="0.1"
              required
              placeholder="Enter humidity"
            />
          </div>

          <div className="form-group">
            <label htmlFor="ph">Soil pH</label>
            <input
              type="number"
              id="ph"
              name="ph"
              value={formData.ph}
              onChange={handleInputChange}
              min="0"
              max="14"
              step="0.1"
              required
              placeholder="Enter soil pH"
            />
          </div>

          <div className="form-group">
            <label htmlFor="rainfall">Rainfall (mm)</label>
            <input
              type="number"
              id="rainfall"
              name="rainfall"
              value={formData.rainfall}
              onChange={handleInputChange}
              step="0.1"
              required
              placeholder="Enter rainfall"
            />
          </div>

          <div className="form-group">
            <label htmlFor="ozone">Ozone Level (μg/m³)</label>
            <input
              type="number"
              id="ozone"
              name="ozone"
              value={formData.ozone}
              onChange={handleInputChange}
              step="0.01"
              required
              placeholder="Enter ozone level"
            />
          </div>
        </div>

        {weatherData && (
          <div className="weather-display">
            <h4>Current Weather Conditions:</h4>
            <p><strong>Temperature:</strong> {weatherData.temp}°C</p>
            <p><strong>Humidity:</strong> {weatherData.humidity}%</p>
            <p><strong>Rainfall:</strong> {weatherData.rain}mm</p>
            <button 
              type="button" 
              className="fill-weather-btn"
              onClick={fillWeatherData}
            >
              Use Current Weather Data
            </button>
          </div>
        )}

        <button 
          type="submit" 
          className="predict-btn"
          disabled={loading || Object.values(formData).some(val => val === '')}
        >
          {loading ? 'Getting Recommendation...' : 'Get Crop Recommendation'}
        </button>
      </form>

      {result && (
        <div className="result-card">
          <p className="result-text">{result}</p>
        </div>
      )}

      {error && (
        <div className="result-card error">
          <p className="result-text error">{error}</p>
        </div>
      )}
    </div>
  )
}

export default CropRecommendation

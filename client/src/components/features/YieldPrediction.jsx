import { useState } from 'react'
import axios from 'axios'
import LoadingAnimation from '../LoadingAnimation'

const YieldPrediction = ({ position, weatherData }) => {
  const [formData, setFormData] = useState({
    ozone: '',
    soil: ''
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
      const response = await axios.get('http://localhost:8000/predict_yield', {
        params: {
          lat: position.lat,
          lon: position.lng,
          ozone: parseFloat(formData.ozone),
          soil: parseFloat(formData.soil)
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
    <div className="yield-prediction">
      <h2>📈 Yield Prediction</h2>
      <p>Predict potato yield based on environmental conditions and soil quality.</p>
      
      <form onSubmit={handleSubmit} className="feature-form">
        <div className="form-grid">
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
          
          <div className="form-group">
            <label htmlFor="soil">Soil Quality Index (0-100)</label>
            <input
              type="number"
              id="soil"
              name="soil"
              value={formData.soil}
              onChange={handleInputChange}
              min="0"
              max="100"
              step="0.1"
              required
              placeholder="Enter soil quality index"
            />
          </div>
        </div>

        {weatherData && (
          <div className="weather-display">
            <h4>Current Weather Conditions:</h4>
            <p><strong>Temperature:</strong> {weatherData.temp}°C</p>
            <p><strong>Rainfall:</strong> {weatherData.rain}mm</p>
          </div>
        )}

        <button 
          type="submit" 
          className="predict-btn"
          disabled={loading || !formData.ozone || !formData.soil}
        >
          {loading ? '🔄 Predicting...' : 'Predict Yield'}
        </button>
      </form>

      {loading && (
        <LoadingAnimation type="harvest" message="Analyzing yield potential..." />
      )}

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

export default YieldPrediction

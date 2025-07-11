import { useState } from 'react'
import axios from 'axios'
import LoadingAnimation from '../LoadingAnimation'

const FertilizerRecommendation = ({ position, weatherData }) => {
  const [formData, setFormData] = useState({
    ozone: '',
    soil: '',
    ph: '',
    stage: ''
  })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const growthStages = [
    'Planting', 'Vegetative', 'Flowering', 'Tuber Development', 'Maturity'
  ]

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
      const response = await axios.get('http://localhost:8000/recommend_fertilizer', {
        params: {
          lat: position.lat,
          lon: position.lng,
          ozone: parseFloat(formData.ozone),
          soil: parseFloat(formData.soil),
          ph: parseFloat(formData.ph),
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

  return (
    <div className="fertilizer-recommendation">
      <h2>🧪 Fertilizer Recommendation</h2>
      <p>Get optimal fertilizer recommendations based on soil conditions and crop growth stage.</p>
      
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

          <div className="form-group">
            <label htmlFor="ph">Soil pH Level</label>
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
              placeholder="Enter soil pH level"
            />
          </div>

          <div className="form-group">
            <label htmlFor="stage">Growth Stage</label>
            <select
              id="stage"
              name="stage"
              value={formData.stage}
              onChange={handleInputChange}
              required
            >
              <option value="">Select growth stage</option>
              {growthStages.map((stage) => (
                <option key={stage} value={stage}>{stage}</option>
              ))}
            </select>
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
          disabled={loading || !formData.ozone || !formData.soil || !formData.ph || !formData.stage}
        >
          {loading ? '🔄 Getting Recommendation...' : 'Get Recommendation'}
        </button>
      </form>

      {loading && (
        <LoadingAnimation type="growth" message="Finding the best fertilizer for your crops..." />
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

export default FertilizerRecommendation

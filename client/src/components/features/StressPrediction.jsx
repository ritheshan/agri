import { useState } from 'react'
import axios from 'axios'

const StressPrediction = ({ position, weatherData }) => {
  const [formData, setFormData] = useState({
    ozone: '',
    temp: '',
    humidity: '',
    color: '',
    symptom: ''
  })
  const [result, setResult] = useState(null)
  const [explanation, setExplanation] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const leafColors = ['Green', 'Yellow', 'Brown', 'Black', 'Purple']
  const symptoms = ['None', 'Spots', 'Wilting', 'Curling', 'Yellowing', 'Browning']

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
      const response = await axios.get('http://localhost:8000/predict_stress', {
        params: {
          lat: position.lat,
          lon: position.lng,
          ozone: parseFloat(formData.ozone),
          temp: parseFloat(formData.temp),
          humidity: parseFloat(formData.humidity),
          color: formData.color,
          symptom: formData.symptom
        }
      })

      setResult(response.data.result)
      setExplanation(response.data.explanation)
    } catch (err) {
      setError('Failed to predict stress level. Please try again.')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="stress-prediction">
      <h2>⚠️ Crop Stress Level Prediction</h2>
      <p>Analyze crop stress levels based on environmental conditions and visual symptoms.</p>
      
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
            <label htmlFor="temp">Temperature (°C)</label>
            <input
              type="number"
              id="temp"
              name="temp"
              value={formData.temp}
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
              placeholder="Enter humidity percentage"
            />
          </div>

          <div className="form-group">
            <label htmlFor="color">Leaf Color</label>
            <select
              id="color"
              name="color"
              value={formData.color}
              onChange={handleInputChange}
              required
            >
              <option value="">Select leaf color</option>
              {leafColors.map((color) => (
                <option key={color} value={color}>{color}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="symptom">Visible Symptoms</label>
            <select
              id="symptom"
              name="symptom"
              value={formData.symptom}
              onChange={handleInputChange}
              required
            >
              <option value="">Select symptoms</option>
              {symptoms.map((symptom) => (
                <option key={symptom} value={symptom}>{symptom}</option>
              ))}
            </select>
          </div>
        </div>

        {weatherData && (
          <div className="weather-display">
            <h4>Current Weather Conditions:</h4>
            <p><strong>Temperature:</strong> {weatherData.temp}°C</p>
            <p><strong>Humidity:</strong> {weatherData.humidity}%</p>
          </div>
        )}

        <button 
          type="submit" 
          className="predict-btn"
          disabled={loading || !formData.ozone || !formData.temp || !formData.humidity || !formData.color || !formData.symptom}
        >
          {loading ? 'Analyzing...' : 'Analyze Stress Level'}
        </button>
      </form>

      {result && (
        <div className="result-card">
          <p className="result-text">{result}</p>
          {explanation && (
            <div className="explanation">
              <h4>Explanation:</h4>
              <p>{explanation}</p>
            </div>
          )}
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

export default StressPrediction

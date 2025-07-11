import { useState, useEffect } from 'react'
import axios from 'axios'

const WeatherInfo = ({ position, onWeatherUpdate }) => {
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchWeatherData()
  }, [position])

  const fetchWeatherData = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await axios.get('http://localhost:8000/get_agri_data', {
        params: {
          lat: position.lat,
          lon: position.lng
        }
      })

      if (response.data.weather) {
        setWeather(response.data.weather)
        onWeatherUpdate(response.data.weather)
      }
    } catch (err) {
      setError('Failed to fetch weather data')
      console.error('Error fetching weather:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="weather-info">
        <div className="loading">Loading weather data...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="weather-info">
        <h3>🌤️ Weather Information</h3>
        <div className="result-card error">
          <p className="result-text error">{error}</p>
          <button onClick={fetchWeatherData} className="predict-btn">
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!weather) {
    return null
  }

  return (
    <div className="weather-info">
      <h3>🌤️ Current Weather Conditions</h3>
      <div className="weather-grid">
        <div className="weather-item">
          <div className="weather-icon">🌡️</div>
          <div className="weather-label">Temperature</div>
          <div className="weather-value">{weather.temp}°C</div>
        </div>
        
        <div className="weather-item">
          <div className="weather-icon">💧</div>
          <div className="weather-label">Humidity</div>
          <div className="weather-value">{weather.humidity}%</div>
        </div>
        
        <div className="weather-item">
          <div className="weather-icon">🌧️</div>
          <div className="weather-label">Rainfall</div>
          <div className="weather-value">{weather.rain}mm</div>
        </div>
        
        <div className="weather-item">
          <div className="weather-icon">💨</div>
          <div className="weather-label">Wind Speed</div>
          <div className="weather-value">{weather.wind_speed} km/h</div>
        </div>
        
        <div className="weather-item">
          <div className="weather-icon">👁️</div>
          <div className="weather-label">Visibility</div>
          <div className="weather-value">{weather.visibility} km</div>
        </div>
        
        <div className="weather-item">
          <div className="weather-icon">📊</div>
          <div className="weather-label">Pressure</div>
          <div className="weather-value">{weather.pressure} hPa</div>
        </div>
      </div>
      
      <button 
        onClick={fetchWeatherData} 
        className="predict-btn"
        style={{ marginTop: '1rem' }}
      >
        🔄 Refresh Weather Data
      </button>
    </div>
  )
}

export default WeatherInfo

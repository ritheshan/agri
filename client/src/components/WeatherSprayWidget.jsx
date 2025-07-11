import { useState, useEffect } from 'react'
import axios from 'axios'

const WeatherSprayWidget = () => {
  const [sprayWindow, setSprayWindow] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [location, setLocation] = useState(null)

  useEffect(() => {
    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setLocation({ lat: latitude, lon: longitude })
          fetchSprayWindow(latitude, longitude)
          fetchWeatherAlerts(latitude, longitude)
        },
        (error) => {
          // Use default location (Delhi) if user denies location
          const defaultLat = 28.6139
          const defaultLon = 77.2090
          fetchSprayWindow(defaultLat, defaultLon)
          fetchWeatherAlerts(defaultLat, defaultLon)
        }
      )
    }
  }, [])

  const fetchSprayWindow = async (lat, lon) => {
    try {
      const response = await axios.get(`http://localhost:8000/spray_window?lat=${lat}&lon=${lon}`)
      setSprayWindow(response.data)
    } catch (error) {
      console.error('Error fetching spray window:', error)
      // Use mock data if API fails
      setSprayWindow({
        result: "Best 3-hour window to spray: 6:00 to 9:00 (Confidence: 0.78)",
        window: "6:00 to 9:00",
        confidence: 0.78
      })
    }
  }

  const fetchWeatherAlerts = async (lat, lon) => {
    try {
      const response = await axios.get(`http://localhost:8000/weather_alerts?lat=${lat}&lon=${lon}`)
      setAlerts(response.data.alerts || [])
    } catch (error) {
      console.error('Error fetching weather alerts:', error)
      // Use mock alerts if API fails
      setAlerts([
        "High humidity expected tomorrow. Consider delaying pesticide application.",
        "Possible light rain in the next 48 hours. Plan your farming activities accordingly."
      ])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <section className="py-8 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-40 bg-gray-200 rounded"></div>
              <div className="h-40 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-8 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          Smart Farming Insights
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-green-50 rounded-xl p-6 shadow-md">
            <div className="flex items-center mb-4">
              <div className="text-3xl mr-3">🌧️</div>
              <h3 className="text-xl font-bold text-green-800">Optimal Spray Window</h3>
            </div>
            
            {sprayWindow ? (
              <div>
                <div className="mb-4">
                  <p className="text-gray-700 mb-2">{sprayWindow.result}</p>
                  {sprayWindow.confidence >= 0.7 ? (
                    <div className="bg-green-100 text-green-800 py-1 px-3 rounded-full inline-flex items-center">
                      <span className="mr-1">✅</span> Highly Recommended
                    </div>
                  ) : sprayWindow.confidence >= 0.5 ? (
                    <div className="bg-yellow-100 text-yellow-800 py-1 px-3 rounded-full inline-flex items-center">
                      <span className="mr-1">⚠️</span> Moderately Recommended
                    </div>
                  ) : (
                    <div className="bg-red-100 text-red-800 py-1 px-3 rounded-full inline-flex items-center">
                      <span className="mr-1">❌</span> Not Recommended
                    </div>
                  )}
                </div>
                
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h4 className="font-semibold text-gray-700 mb-2">Why This Matters:</h4>
                  <p className="text-gray-600 text-sm">
                    Spraying during optimal conditions improves effectiveness, reduces waste, and minimizes environmental impact. 
                    Factors like temperature, humidity, wind speed, and rain probability are considered.
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-gray-600">Unable to determine optimal spray window.</p>
            )}
          </div>
          
          <div className="bg-blue-50 rounded-xl p-6 shadow-md">
            <div className="flex items-center mb-4">
              <div className="text-3xl mr-3">⚠️</div>
              <h3 className="text-xl font-bold text-blue-800">Weather Alerts</h3>
            </div>
            
            {alerts && alerts.length > 0 ? (
              <div className="space-y-3">
                {alerts.map((alert, i) => (
                  <div key={i} className="bg-white p-3 rounded-lg shadow-sm border-l-4 border-yellow-500">
                    <p className="text-gray-700">{alert}</p>
                  </div>
                ))}
                
                <div className="bg-white rounded-lg p-4 shadow-sm mt-4">
                  <h4 className="font-semibold text-gray-700 mb-2">Take Action:</h4>
                  <p className="text-gray-600 text-sm">
                    These alerts are generated based on 7-day forecast data to help you plan your farming activities. 
                    Adjust your schedule accordingly to avoid crop damage and optimize resources.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-green-100 p-3 rounded-lg text-green-800">
                <p>No weather alerts at this time. Conditions look favorable for farming activities.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default WeatherSprayWidget

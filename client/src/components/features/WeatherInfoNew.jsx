const WeatherInfoNew = ({ weatherData }) => {
  if (!weatherData) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <div className="text-4xl mb-2">🌤️</div>
        <p className="text-gray-500">No weather data available</p>
      </div>
    )
  }

  const getWindDirection = (degrees) => {
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
    return directions[Math.round(degrees / 45) % 8]
  }

  const getVisibilityStatus = (visibility) => {
    if (visibility >= 10) return { status: "Excellent", color: "text-green-600" }
    if (visibility >= 5) return { status: "Good", color: "text-yellow-600" }
    if (visibility >= 1) return { status: "Poor", color: "text-orange-600" }
    return { status: "Very Poor", color: "text-red-600" }
  }

  const getPressureStatus = (pressure) => {
    if (pressure > 1020) return { status: "High", color: "text-blue-600" }
    if (pressure > 1000) return { status: "Normal", color: "text-green-600" }
    return { status: "Low", color: "text-red-600" }
  }

  const weatherItems = [
    {
      icon: "🌡️",
      label: "Temperature",
      value: `${weatherData.temp}°C`,
      color: "text-red-500",
      bg: "bg-red-50"
    },
    {
      icon: "💧",
      label: "Humidity",
      value: `${weatherData.humidity}%`,
      color: "text-blue-500",
      bg: "bg-blue-50"
    },
    {
      icon: "🌧️",
      label: "Rainfall",
      value: `${weatherData.rain}mm`,
      color: "text-indigo-500",
      bg: "bg-indigo-50"
    },
    {
      icon: "💨",
      label: "Wind Speed",
      value: `${weatherData.windSpeed || weatherData.wind_speed || 0} km/h`,
      subValue: weatherData.windDirection || weatherData.wind_direction ? `${getWindDirection(weatherData.windDirection || weatherData.wind_direction)}` : null,
      color: "text-gray-600",
      bg: "bg-gray-50"
    },
    {
      icon: "👁️",
      label: "Visibility",
      value: `${weatherData.visibility || 10} km`,
      subValue: getVisibilityStatus(weatherData.visibility || 10).status,
      color: getVisibilityStatus(weatherData.visibility || 10).color,
      bg: "bg-purple-50"
    },
    {
      icon: "🔽",
      label: "Pressure",
      value: `${weatherData.pressure || 1013} hPa`,
      subValue: getPressureStatus(weatherData.pressure || 1013).status,
      color: getPressureStatus(weatherData.pressure || 1013).color,
      bg: "bg-green-50"
    }
  ]

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <span className="mr-2">🌤️</span>
        Current Weather
      </h3>
      
      <div className="space-y-3">
        {weatherItems.map((item, index) => (
          <div key={index} className={`${item.bg} rounded-lg p-4`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <div className="text-sm text-gray-600">{item.label}</div>
                  {item.subValue && (
                    <div className={`text-xs font-medium ${item.color}`}>
                      {item.subValue}
                    </div>
                  )}
                </div>
              </div>
              <div className={`text-lg font-semibold ${item.color}`}>
                {item.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h4 className="text-sm font-semibold text-yellow-800 mb-2">📊 Farming Conditions</h4>
        <div className="text-xs text-yellow-700 space-y-1">
          {weatherData.temp > 30 && (
            <div>• High temperature - ensure adequate irrigation</div>
          )}
          {weatherData.humidity > 80 && (
            <div>• High humidity - monitor for fungal diseases</div>
          )}
          {(weatherData.windSpeed || weatherData.wind_speed || 0) > 25 && (
            <div>• Strong winds - protect young plants</div>
          )}
          {weatherData.rain > 20 && (
            <div>• Heavy rainfall - check drainage systems</div>
          )}
          {weatherData.temp < 5 && (
            <div>• Cold temperature - protect from frost</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default WeatherInfoNew

import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import YieldPrediction from './features/YieldPrediction'
import FertilizerRecommendation from './features/FertilizerRecommendation'
import StressPrediction from './features/StressPrediction'
import CropRecommendation from './features/CropRecommendation'
import DiseaseDetection from './features/DiseaseDetection'
import ProfitCalculator from './features/ProfitCalculator'
import WeatherInfo from './features/WeatherInfo'
import './Dashboard.css'

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

function LocationMarker({ position, setPosition }) {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng)
      map.flyTo(e.latlng, map.getZoom())
    },
  })

  return position === null ? null : (
    <Marker position={position}>
      <Popup>Selected Location</Popup>
    </Marker>
  )
}

const Dashboard = () => {
  const [activeFeature, setActiveFeature] = useState('yield')
  const [position, setPosition] = useState({ lat: 20.5937, lng: 78.9629 }) // Default to India center
  const [weatherData, setWeatherData] = useState(null)

  const features = [
    { id: 'yield', name: 'Yield Prediction', icon: '📈' },
    { id: 'fertilizer', name: 'Fertilizer Recommendation', icon: '🧪' },
    { id: 'stress', name: 'Stress Prediction', icon: '⚠️' },
    { id: 'crop', name: 'Crop Recommendation', icon: '🌱' },
    { id: 'disease', name: 'Disease Detection', icon: '📸' },
    { id: 'profit', name: 'Profit Calculator', icon: '💰' },
  ]

  const renderFeatureComponent = () => {
    const commonProps = { position, weatherData }
    
    switch (activeFeature) {
      case 'yield':
        return <YieldPrediction {...commonProps} />
      case 'fertilizer':
        return <FertilizerRecommendation {...commonProps} />
      case 'stress':
        return <StressPrediction {...commonProps} />
      case 'crop':
        return <CropRecommendation {...commonProps} />
      case 'disease':
        return <DiseaseDetection />
      case 'profit':
        return <ProfitCalculator />
      default:
        return <YieldPrediction {...commonProps} />
    }
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>🌾 AgriMaster Dashboard</h1>
          <a href="/" className="back-home">← Back to Home</a>
        </div>
      </header>

      <div className="dashboard-content">
        <aside className="sidebar">
          <h3>Features</h3>
          <nav className="feature-nav">
            {features.map((feature) => (
              <button
                key={feature.id}
                className={`feature-btn ${activeFeature === feature.id ? 'active' : ''}`}
                onClick={() => setActiveFeature(feature.id)}
              >
                <span className="feature-icon">{feature.icon}</span>
                <span className="feature-name">{feature.name}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="main-content">
          <section className="map-section">
            <h2>🌍 Select Your Location</h2>
            <div className="map-container">
              <MapContainer
                center={[position.lat, position.lng]}
                zoom={5}
                style={{ height: '400px', width: '100%' }}
                className="leaflet-map"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker position={position} setPosition={setPosition} />
              </MapContainer>
            </div>
            <div className="location-info">
              <p><strong>Selected Location:</strong> {position.lat.toFixed(4)}, {position.lng.toFixed(4)}</p>
            </div>
          </section>

          <WeatherInfo position={position} onWeatherUpdate={setWeatherData} />

          <section className="feature-section">
            {renderFeatureComponent()}
          </section>
        </main>
      </div>
    </div>
  )
}

export default Dashboard

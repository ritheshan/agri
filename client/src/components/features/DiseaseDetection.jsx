import { useState, useRef } from 'react'
import axios from 'axios'
import LoadingAnimation from '../LoadingAnimation'
import './DiseaseDetection.css'

const DiseaseDetection = () => {
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  // Environmental prediction state
  const [envData, setEnvData] = useState({
    temperature: '',
    humidity: '',
    rainfall: '',
    cloud_cover: '',
    wind_speed: '',
    leaf_wetness: ''
  })
  const [envResult, setEnvResult] = useState(null)
  const [envLoading, setEnvLoading] = useState(false)
  const [envError, setEnvError] = useState(null)

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.type.startsWith('image/')) {
        setSelectedFile(file)
        const url = URL.createObjectURL(file)
        setPreviewUrl(url)
        setError(null)
      } else {
        setError('Please select a valid image file')
      }
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      setError(null)
    } else {
      setError('Please drop a valid image file')
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select an image first')
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      
      const response = await axios.post('http://localhost:8000/detect_disease', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      setResult(response.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to analyze image')
    } finally {
      setLoading(false)
    }
    setError(null)

    const formData = new FormData()
    formData.append('file', selectedFile)

    try {
      const response = await axios.post('http://localhost:8000/detect_disease', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      setResult(response.data)
    } catch (err) {
      setError('Failed to analyze image. Please try again.')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const clearImage = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setResult(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Environmental prediction functions
  const handleEnvDataChange = (e) => {
    const { name, value } = e.target
    setEnvData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const predictEnvironmentalDisease = async () => {
    // Validate input
    const requiredFields = ['temperature', 'humidity', 'rainfall', 'cloud_cover', 'wind_speed', 'leaf_wetness']
    const missingFields = requiredFields.filter(field => !envData[field])
    
    if (missingFields.length > 0) {
      setEnvError(`Please fill in all fields: ${missingFields.join(', ')}`)
      return
    }

    setEnvLoading(true)
    setEnvError(null)
    
    try {
      const params = new URLSearchParams({
        temperature: envData.temperature,
        humidity: envData.humidity,
        rainfall: envData.rainfall,
        cloud_cover: envData.cloud_cover,
        wind_speed: envData.wind_speed,
        leaf_wetness: envData.leaf_wetness
      })
      
      const response = await axios.get(`http://localhost:8000/predict_disease_environmental?${params}`)
      setEnvResult(response.data)
    } catch (err) {
      setEnvError(err.response?.data?.detail || 'Failed to predict disease risk')
    } finally {
      setEnvLoading(false)
    }
  }

  return (
    <div className="disease-detection">
      <h2>📸 Disease Detection</h2>
      <p>Upload an image of your crop to detect diseases and get treatment recommendations.</p>
      
      <div className="upload-section">
        <div 
          className={`upload-area ${selectedFile ? 'has-file' : ''}`}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          {!previewUrl ? (
            <>
              <div className="upload-icon">📸</div>
              <p>Drag and drop an image here or click to select</p>
              <p className="upload-hint">Supported formats: JPG, PNG, GIF</p>
            </>
          ) : (
            <div className="image-preview">
              <img src={previewUrl} alt="Preview" />
              <button 
                className="remove-image"
                onClick={(e) => {
                  e.stopPropagation()
                  clearImage()
                }}
              >
                ✕
              </button>
            </div>
          )}
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        
        {selectedFile && (
          <div className="file-info">
            <p><strong>Selected:</strong> {selectedFile.name}</p>
            <p><strong>Size:</strong> {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        )}
        
        <div className="action-buttons">
          <button 
            className="analyze-btn"
            onClick={handleUpload}
            disabled={!selectedFile || loading}
          >
            {loading ? '🔄 Analyzing...' : 'Analyze Image'}
          </button>
          
          {selectedFile && (
            <button className="clear-btn" onClick={clearImage}>
              Clear
            </button>
          )}
        </div>
      </div>

      {loading && (
        <LoadingAnimation type="analysis" message="Analyzing your plant image..." />
      )}

      {error && (
        <div className="result-card error">
          <p className="result-text error">{error}</p>
        </div>
      )}

      {result && (
        <div className="result-card">
          <h3>Analysis Results</h3>
          <div className="disease-result">
            <div className="result-item">
              <strong>Disease Detected:</strong> {result.disease || 'Healthy'}
            </div>
            <div className="result-item">
              <strong>Confidence:</strong> {result.confidence || 'N/A'}%
            </div>
            {result.treatment && (
              <div className="result-item">
                <strong>Recommended Treatment:</strong>
                <p>{result.treatment}</p>
              </div>
            )}
            {result.prevention && (
              <div className="result-item">
                <strong>Prevention Tips:</strong>
                <ul>
                  {result.prevention.map((tip, index) => (
                    <li key={index}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="environmental-section">
        <h3>🌤️ Environmental Disease Risk Prediction</h3>
        <p>Predict disease risk based on current environmental conditions</p>
        
        <div className="env-form">
          <div className="form-grid">
            <div className="form-group">
              <label>Temperature (°C)</label>
              <input
                type="number"
                name="temperature"
                value={envData.temperature}
                onChange={handleEnvDataChange}
                placeholder="e.g., 25.5"
                step="0.1"
              />
            </div>
            <div className="form-group">
              <label>Humidity (%)</label>
              <input
                type="number"
                name="humidity"
                value={envData.humidity}
                onChange={handleEnvDataChange}
                placeholder="e.g., 65"
                min="0"
                max="100"
              />
            </div>
            <div className="form-group">
              <label>Rainfall (mm)</label>
              <input
                type="number"
                name="rainfall"
                value={envData.rainfall}
                onChange={handleEnvDataChange}
                placeholder="e.g., 5.2"
                step="0.1"
                min="0"
              />
            </div>
            <div className="form-group">
              <label>Cloud Cover (%)</label>
              <input
                type="number"
                name="cloud_cover"
                value={envData.cloud_cover}
                onChange={handleEnvDataChange}
                placeholder="e.g., 40"
                min="0"
                max="100"
              />
            </div>
            <div className="form-group">
              <label>Wind Speed (km/h)</label>
              <input
                type="number"
                name="wind_speed"
                value={envData.wind_speed}
                onChange={handleEnvDataChange}
                placeholder="e.g., 15"
                step="0.1"
                min="0"
              />
            </div>
            <div className="form-group">
              <label>Leaf Wetness (hours)</label>
              <input
                type="number"
                name="leaf_wetness"
                value={envData.leaf_wetness}
                onChange={handleEnvDataChange}
                placeholder="e.g., 8"
                step="0.1"
                min="0"
                max="24"
              />
            </div>
          </div>
          
          <button 
            className="predict-btn"
            onClick={predictEnvironmentalDisease}
            disabled={envLoading}
          >
            {envLoading ? '🔄 Analyzing...' : '🔍 Predict Disease Risk'}
          </button>
        </div>

        {envError && (
          <div className="error-message">
            <p>❌ {envError}</p>
          </div>
        )}

        {envLoading && (
          <LoadingAnimation type="weather" message="Analyzing environmental conditions..." />
        )}

        {envResult && (
          <div className="env-result">
            <h4>Environmental Risk Analysis</h4>
            <div className="result-grid">
              <div className="result-card">
                <h5>Predicted Disease</h5>
                <p className={`disease-name ${envResult.predicted_disease?.toLowerCase()}`}>
                  {envResult.predicted_disease}
                </p>
              </div>
              <div className="result-card">
                <h5>Risk Level</h5>
                <p className={`risk-level ${envResult.risk_level?.toLowerCase()}`}>
                  {envResult.risk_level}
                </p>
              </div>
              <div className="result-card">
                <h5>Confidence</h5>
                <p>{(envResult.confidence * 100).toFixed(1)}%</p>
              </div>
            </div>
            
            {envResult.recommendations && (
              <div className="recommendations">
                <h5>Recommendations</h5>
                <ul>
                  {envResult.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="tips-section">
        <h3>Tips for Better Results</h3>
        <div className="tips-grid">
          <div className="tip-card">
            <div className="tip-icon">💡</div>
            <h4>Good Lighting</h4>
            <p>Take photos in natural daylight for best results</p>
          </div>
          <div className="tip-card">
            <div className="tip-icon">🔍</div>
            <h4>Clear Focus</h4>
            <p>Ensure the affected area is clearly visible and in focus</p>
          </div>
          <div className="tip-card">
            <div className="tip-icon">📏</div>
            <h4>Close-up View</h4>
            <p>Take close-up photos of the affected leaves or areas</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DiseaseDetection

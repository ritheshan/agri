import { useState, useRef } from 'react'
import axios from 'axios'
import LoadingAnimation from '../LoadingAnimation'

const DiseaseDetectionNew = () => {
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [detectionType, setDetectionType] = useState('image') // 'image' or 'environmental'
  const fileInputRef = useRef(null)

  // Environmental data form
  const [environmentalData, setEnvironmentalData] = useState({
    temperature: 25,
    humidity: 60,
    soil_moisture: 50,
    ph: 6.5,
    nitrogen: 50,
    phosphorus: 50,
    potassium: 50
  })

  const handleImageSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = (e) => setImagePreview(e.target.result)
      reader.readAsDataURL(file)
      setError(null)
    }
  }

  const handleEnvironmentalChange = (name, value) => {
    setEnvironmentalData(prev => ({
      ...prev,
      [name]: parseFloat(value)
    }))
  }

  const handleImageDetection = async () => {
    if (!selectedImage) {
      setError('Please select an image first')
      return
    }

    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', selectedImage)

    try {
      const response = await axios.post('http://localhost:8000/detect_disease', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      setResult(response.data)
    } catch (err) {
      setError('Failed to detect disease. Please try again.')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleEnvironmentalDetection = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await axios.post('http://localhost:8000/detect_disease_environmental', environmentalData)
      setResult(response.data)
    } catch (err) {
      setError('Failed to detect disease. Please try again.')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = () => {
    if (detectionType === 'image') {
      handleImageDetection()
    } else {
      handleEnvironmentalDetection()
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl">
        <h3 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
          <span className="mr-3">📸</span>
          Disease Detection
        </h3>
        <p className="text-gray-600">
          Detect plant diseases using image analysis or environmental conditions
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Detection Method</h4>
        <div className="flex space-x-4">
          <button
            onClick={() => setDetectionType('image')}
            className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center space-x-2 ${
              detectionType === 'image'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-purple-50'
            }`}
          >
            <span>📷</span>
            <span>Image Analysis</span>
          </button>
          <button
            onClick={() => setDetectionType('environmental')}
            className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center space-x-2 ${
              detectionType === 'environmental'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-purple-50'
            }`}
          >
            <span>🌡️</span>
            <span>Environmental Data</span>
          </button>
        </div>
      </div>

      {detectionType === 'image' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="mr-2">📷</span>
            Upload Plant Image
          </h4>
          
          <div className="space-y-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors"
            >
              {imagePreview ? (
                <div className="space-y-4">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-64 mx-auto rounded-lg shadow-md"
                  />
                  <p className="text-sm text-gray-600">Click to change image</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-4xl">📸</div>
                  <p className="text-lg font-medium text-gray-600">Upload Plant Image</p>
                  <p className="text-sm text-gray-500">
                    Click here or drag and drop your plant image
                  </p>
                  <p className="text-xs text-gray-400">
                    Supports: JPG, PNG, WebP (Max: 10MB)
                  </p>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
          </div>
        </div>
      )}

      {detectionType === 'environmental' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="mr-2">🌡️</span>
            Environmental Conditions
          </h4>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temperature: {environmentalData.temperature}°C
                </label>
                <input
                  type="range"
                  min="0"
                  max="45"
                  value={environmentalData.temperature}
                  onChange={(e) => handleEnvironmentalChange('temperature', e.target.value)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-purple"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0°C</span>
                  <span>45°C</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Humidity: {environmentalData.humidity}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={environmentalData.humidity}
                  onChange={(e) => handleEnvironmentalChange('humidity', e.target.value)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-purple"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Soil Moisture: {environmentalData.soil_moisture}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={environmentalData.soil_moisture}
                  onChange={(e) => handleEnvironmentalChange('soil_moisture', e.target.value)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-purple"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  pH Level: {environmentalData.ph}
                </label>
                <input
                  type="range"
                  min="3"
                  max="10"
                  step="0.1"
                  value={environmentalData.ph}
                  onChange={(e) => handleEnvironmentalChange('ph', e.target.value)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-purple"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>3.0</span>
                  <span>10.0</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nitrogen: {environmentalData.nitrogen} kg/ha
                </label>
                <input
                  type="range"
                  min="0"
                  max="140"
                  value={environmentalData.nitrogen}
                  onChange={(e) => handleEnvironmentalChange('nitrogen', e.target.value)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-purple"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0</span>
                  <span>140</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phosphorus: {environmentalData.phosphorus} kg/ha
                </label>
                <input
                  type="range"
                  min="5"
                  max="145"
                  value={environmentalData.phosphorus}
                  onChange={(e) => handleEnvironmentalChange('phosphorus', e.target.value)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-purple"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>5</span>
                  <span>145</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Potassium: {environmentalData.potassium} kg/ha
                </label>
                <input
                  type="range"
                  min="5"
                  max="205"
                  value={environmentalData.potassium}
                  onChange={(e) => handleEnvironmentalChange('potassium', e.target.value)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-purple"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>5</span>
                  <span>205</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || (detectionType === 'image' && !selectedImage)}
        className="w-full bg-purple-500 text-white py-3 px-6 rounded-xl font-semibold hover:bg-purple-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
      >
        {loading ? (
          <>
            <LoadingAnimation type="spinner" size="sm" />
            <span>Analyzing...</span>
          </>
        ) : (
          <>
            <span>🔍</span>
            <span>Detect Disease</span>
          </>
        )}
      </button>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center">
            <span className="text-red-500 mr-2">❌</span>
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {result && (
        <div className="bg-white border rounded-xl p-6 shadow-sm">
          <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="mr-2">📊</span>
            Detection Results
          </h4>
          
          {result.disease && result.disease !== 'Healthy' ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <span className="text-2xl">⚠️</span>
                <div className="flex-1">
                  <h5 className="font-semibold text-red-800">Disease Detected</h5>
                  <p className="text-red-700 capitalize">{result.disease}</p>
                  {result.confidence && (
                    <p className="text-sm text-red-600 mt-1">
                      Confidence: {(result.confidence * 100).toFixed(1)}%
                    </p>
                  )}
                  {result.recommendation && (
                    <div className="mt-3 p-3 bg-red-100 rounded">
                      <h6 className="font-medium text-red-800">Recommendation:</h6>
                      <p className="text-red-700 text-sm mt-1">{result.recommendation}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">✅</span>
                <div>
                  <h5 className="font-semibold text-green-800">Plant is Healthy</h5>
                  <p className="text-green-700">No diseases detected</p>
                  {result.confidence && (
                    <p className="text-sm text-green-600 mt-1">
                      Confidence: {(result.confidence * 100).toFixed(1)}%
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default DiseaseDetectionNew

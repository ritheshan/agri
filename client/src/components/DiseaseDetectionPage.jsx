import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeftIcon, CameraIcon, CloudArrowUpIcon, XCircleIcon, CheckCircleIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import LoadingAnimation from './LoadingAnimation'
import ErrorBoundary from './ErrorBoundary'
import { ENDPOINTS } from '../config/apiConfig'
import axiosInstance from '../config/axiosConfig'

const DiseaseDetectionPage = () => {
  const navigate = useNavigate()
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [detectionType, setDetectionType] = useState('image')
  const fileInputRef = useRef(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [isCamera, setIsCamera] = useState(false)
  const [aiInsights, setAiInsights] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [userConfirmation, setUserConfirmation] = useState(null) // 'correct', 'incorrect', or null

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

  // Start camera on component mount
  useEffect(() => {
    // Don't automatically start camera on mount to avoid permission issues
    // Only start camera when user clicks the camera button
    
    // Clean up camera when component unmounts
    return () => {
      stopCamera()
    }
  }, [])

  const startCamera = async () => {
    setError(null) // Clear any previous errors
    
    try {
      // Check if browser supports getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Your browser does not support camera access. Please use file upload instead.')
        return
      }
      
      // Request both environment (back) and user (front) cameras as fallbacks
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsCamera(true)
      }
    } catch (err) {
      console.error('Error accessing camera:', err)
      // More descriptive error message
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access in your browser settings or use file upload instead.')
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on your device. Please use file upload instead.')
      } else {
        setError(`Camera error: ${err.message}. Please use file upload instead.`)
      }
      // Automatically switch to file upload mode
      setIsCamera(false)
    }
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks()
      tracks.forEach(track => track.stop())
      setIsCamera(false)
    }
  }

  const capturePhoto = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    
    if (video && canvas) {
      try {
        
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth || 640
        canvas.height = video.videoHeight || 480
        
        // Draw the current video frame to the canvas
        const context = canvas.getContext('2d')
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        
        // Convert canvas to image blob with high quality
        canvas.toBlob((blob) => {
          if (blob) {
            // Create a File object from the blob
            const file = new File([blob], `captured-image-${Date.now()}.jpg`, { type: 'image/jpeg' })
            
            // Update state with the new image
            setSelectedImage(file)
            setImagePreview(canvas.toDataURL('image/jpeg', 0.95))
            stopCamera()
            setError(null)
            setResult(null)
            setAiInsights(null)
            setUserConfirmation(null)
          } else {
            setError("Failed to capture image. Please try again or use file upload.")
          }
        }, 'image/jpeg', 0.95) // Higher quality (0.95)
      } catch (err) {
        console.error("Error capturing photo:", err)
        setError(`Failed to capture image: ${err.message}. Please try using file upload instead.`)
        stopCamera()
      }
    } else {
      setError("Camera not properly initialized. Please try again or use file upload.")
    }
  }

  const handleImageSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = (e) => setImagePreview(e.target.result)
      reader.readAsDataURL(file)
      setError(null)
      setResult(null)
      setAiInsights(null)
      setUserConfirmation(null)
      stopCamera()
    }
  }

  const handleEnvironmentalChange = (name, value) => {
    setEnvironmentalData(prev => ({
      ...prev,
      [name]: parseFloat(value)
    }))
  }

  const resetDetection = () => {
    setSelectedImage(null)
    setImagePreview(null)
    setResult(null)
    setError(null)
    setAiInsights(null)
    setUserConfirmation(null)
    startCamera()
  }

  const handleImageDetection = async () => {
    if (!selectedImage) {
      setError('Please select or capture an image first.')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)
    setAiInsights(null)
    setUserConfirmation(null)

    // Create a FormData object to send the image
    const formData = new FormData()
    
    // For blob URLs (from camera captures), we need to convert to a File object
    if (selectedImage instanceof Blob && !selectedImage.name) {
      // Create a new File object with a proper name
      const file = new File([selectedImage], 'captured-image.jpg', { type: 'image/jpeg' })
      formData.append('file', file)
    } else {
      // For regular File uploads
      formData.append('file', selectedImage)
    }

    try {
      // Show a more detailed loading message
      setLoading(true)
      
      // Make the API request with error handling and longer timeout
      const response = await axiosInstance.post(ENDPOINTS.DETECT_DISEASE, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        // Longer timeout for model processing
        timeout: 60000
      })


      if (response.data && response.data.prediction) {
        // Successful detection
        setResult({
          prediction: response.data.prediction,
          confidence: response.data.confidence,
          usingFallback: response.data.using_fallback || false
        })
        
        // If using fallback, provide info to the user
        if (response.data.using_fallback) {
          setError('Note: Using simplified detection method. Results may be less accurate.')
        }
      } else if (response.data && response.data.error) {
        // API returned an error message
        setError(`API Error: ${response.data.error}`)
      } else {
        // No prediction or error message
        setError('Unable to detect disease. Please try again with a clearer image focusing on the affected leaf.')
      }
    } catch (err) {
      console.error('Error during disease detection:', err)
      
      if (err.response) {
        // Server responded with error status
        console.error("Response data:", err.response.data)
        console.error("Response status:", err.response.status)
        
        if (err.response.status === 413) {
          setError('Image file too large. Please use a smaller image (under 16MB).')
        } else {
          setError(`Server error (${err.response.status}): ${err.response.data?.error || 'Unknown error'}. Try again with a clearer image.`)
        }
      } else if (err.request) {
        // No response received (server down or network issue)
        console.error("No response received:", err.request)
        setError('Cannot connect to the disease detection service. Please check your internet connection and try again.')
      } else {
        // Request setup error
        setError(`Error: ${err.message}. Please try again.`)
      }
    } finally {
      setLoading(false)
    }
  }

  const getAIInsights = async () => {
    if (!result) return

    setAiLoading(true)
    
    try {
      // Call Groq API with Llama3
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192',
          messages: [
            {
              role: 'system',
              content: `You are an agricultural expert specializing in plant diseases. 
              Provide detailed information about plant diseases including:
              1. Disease characteristics and symptoms
              2. Causes and spread mechanisms
              3. Treatment options and recommendations
              4. Preventive measures
              5. Impact on crop yield
              6. Organic/chemical treatment options
              7. Environmental conditions that promote or reduce this disease
              
              Format your response using Markdown:
              - Use ## for main headings (e.g., ## Disease Overview)
              - Use ### for subheadings (e.g., ### Symptoms)
              - Use bullet points for lists
              - Use **bold** for emphasis
              - Use > for important notes or warnings
              - Include emoji icons where appropriate (🌱🔍🌡️🌧️🧪⚠️🍃🔬)
              
              Make your response visually structured and easy to read when rendered as Markdown.`
            },
            {
              role: 'user',
              content: `Provide detailed information about ${result.prediction} in plants. Include symptoms, causes, treatment options, preventive measures, impact on crop yield, and best practices for managing this disease in both organic and conventional farming systems.`
            }
          ],
          max_tokens: 1200,
          temperature: 0.7
        })
      })

      const data = await response.json()
      
      if (data.choices && data.choices[0]) {
        setAiInsights(data.choices[0].message.content)
      } else {
        throw new Error('No response from AI')
      }
    } catch (error) {
      console.error('Error getting AI insights:', error)
      setError('Failed to get AI insights. Please try again.')
    } finally {
      setAiLoading(false)
    }
  }

  const handleUserFeedback = (isCorrect) => {
    setUserConfirmation(isCorrect ? 'correct' : 'incorrect')
    
    if (isCorrect) {
      // If the detection is correct, get AI insights
      getAIInsights()
      
      // Also save this feedback to improve model training
      try {
        axiosInstance.post(ENDPOINTS.DISEASE_FEEDBACK, {
          image_id: selectedImage ? selectedImage.name : 'captured-image',
          prediction: result.prediction,
          is_correct: true,
          confidence: result.confidence
        })
      } catch (error) {
        console.error('Error saving feedback:', error)
      }
    } else {
      // If incorrect, save feedback and reset for a new attempt
      try {
        axiosInstance.post(ENDPOINTS.DISEASE_FEEDBACK, {
          image_id: selectedImage ? selectedImage.name : 'captured-image',
          prediction: result.prediction,
          is_correct: false,
          confidence: result.confidence
        })
      } catch (error) {
        console.error('Error saving feedback:', error)
      }
      
      setError('Please try again with a clearer image of the affected plant part.')
      setResult(null)
      setImagePreview(null)
      setSelectedImage(null)
      startCamera()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Plant Disease Detection</h1>
                <p className="text-sm text-gray-600">Upload or capture a leaf image to detect diseases</p>
              </div>
            </div>
            <div className="text-4xl">🌿</div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          {isCamera && !imagePreview && (
            <div className="mb-6">
              <div className="relative">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline
                  className="w-full rounded-lg border border-gray-300 max-h-96 object-contain mx-auto bg-black"
                />
                <button
                  onClick={capturePhoto}
                  className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-farm-green text-white rounded-full p-4 shadow-lg hover:bg-green-600 transition-all"
                >
                  <CameraIcon className="w-6 h-6" />
                </button>
              </div>
              <p className="text-sm text-center mt-3 text-gray-500">
                Position the plant leaf in the center of the frame and ensure good lighting
              </p>
              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}

          <div className="mb-8">
            {!isCamera && !imagePreview && (
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                <CloudArrowUpIcon className="w-12 h-12 text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">Drag and drop your leaf image here, or click to select</p>
                <div className="flex space-x-4">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-farm-green hover:bg-green-600 text-white font-medium px-4 py-2 rounded-lg transition-colors"
                  >
                    Select Image
                  </button>
                  <button
                    onClick={startCamera}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
                  >
                    Use Camera
                  </button>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            )}

            {imagePreview && (
              <div className="flex flex-col items-center">
                <div className="relative mb-4">
                  <img 
                    src={imagePreview} 
                    alt="Selected leaf" 
                    className="max-h-96 rounded-lg shadow-md mx-auto"
                  />
                  <button
                    onClick={resetDetection}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"
                  >
                    <XCircleIcon className="w-5 h-5" />
                  </button>
                </div>
                {!result && !loading && (
                  <button
                    onClick={handleImageDetection}
                    className="bg-farm-green hover:bg-green-600 text-white font-medium px-6 py-2 rounded-lg transition-colors"
                  >
                    Detect Disease
                  </button>
                )}
              </div>
            )}
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center p-8">
              <LoadingAnimation type="growth" message="Analyzing leaf image..." />
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded-lg">
              <div className="flex items-center">
                <div className="text-red-500">
                  <XCircleIcon className="w-5 h-5" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}

          {result && !userConfirmation && (
            <div className="bg-green-50 rounded-lg p-6 mb-8">
              <h3 className="text-xl font-bold text-green-800 mb-2">Detection Results</h3>
              <div className="mb-6">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-4">
                  <div className="prose max-w-none">
                    <div className="markdown-content">
                      <ErrorBoundary>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {`## ${result.prediction.replace(/_/g, ' ').replace(/___/g, ' - ')}
                          
**Confidence:** ${(result.confidence * 100).toFixed(2)}%

### Recommendations:
${result.recommendations ? result.recommendations.map(rec => `- ${rec}`).join('\n') : ''}

**Severity:** ${result.severity || 'Medium'}
**Treatment Urgency:** ${result.treatment_urgency || 'Medium'}`}
                        </ReactMarkdown>
                      </ErrorBoundary>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <p className="text-gray-700 mb-3">Is this detection correct based on your knowledge?</p>
                  <div className="flex space-x-4">
                    <button 
                      onClick={() => handleUserFeedback(true)}
                      className="flex items-center bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <CheckCircleIcon className="w-5 h-5 mr-2" />
                      Yes, it's correct
                    </button>
                    <button 
                      onClick={() => handleUserFeedback(false)}
                      className="flex items-center bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <XCircleIcon className="w-5 h-5 mr-2" />
                      No, try again
                    </button>
                    <button 
                      onClick={resetDetection}
                      className="flex items-center bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <QuestionMarkCircleIcon className="w-5 h-5 mr-2" />
                      Not sure
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {aiLoading && (
            <div className="bg-blue-50 rounded-lg p-6 mb-8">
              <div className="flex flex-col items-center justify-center">
                <LoadingAnimation type="pulse" message="Getting AI insights about this disease..." />
              </div>
            </div>
          )}

          {aiInsights && (
            <div className="bg-blue-50 rounded-lg p-6 mb-8">
              <h3 className="text-xl font-bold text-blue-800 mb-4">AI Insights</h3>
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="prose prose-headings:text-farm-green prose-headings:font-semibold prose-h2:text-xl prose-h3:text-lg prose-strong:text-farm-green prose-strong:font-medium prose-li:my-1 prose-p:my-2 max-w-none">
                  <div className="markdown-content">
                    <ErrorBoundary>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {aiInsights}
                      </ReactMarkdown>
                    </ErrorBoundary>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-center">
                <button
                  onClick={resetDetection}
                  className="bg-farm-green hover:bg-green-600 text-white font-medium px-6 py-2 rounded-lg transition-colors"
                >
                  Analyze Another Image
                </button>
              </div>
            </div>
          )}

          <div className="bg-yellow-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-800 mb-3">Tips for Better Detection</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="text-yellow-500 mr-2">•</span>
                Use good lighting conditions (natural daylight is best)
              </li>
              <li className="flex items-start">
                <span className="text-yellow-500 mr-2">•</span>
                Capture the entire leaf including edges
              </li>
              <li className="flex items-start">
                <span className="text-yellow-500 mr-2">•</span>
                Hold the camera steady and ensure the leaf is in focus
              </li>
              <li className="flex items-start">
                <span className="text-yellow-500 mr-2">•</span>
                Include both affected and healthy parts of the leaf for comparison
              </li>
              <li className="flex items-start">
                <span className="text-yellow-500 mr-2">•</span>
                Remove the leaf from the plant if possible for clearer imaging
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DiseaseDetectionPage

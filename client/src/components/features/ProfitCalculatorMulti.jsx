import { useState } from 'react'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import LoadingAnimation from '../LoadingAnimation'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

const ProfitCalculatorMulti = () => {
  const [selectedCrops, setSelectedCrops] = useState([])
  const [currentCrop, setCurrentCrop] = useState('potato')
  const [inputs, setInputs] = useState({
    landSize: 1.0,
    seedCost: 15000,
    fertilizerCost: 8000,
    laborCost: 12000,
    irrigationCost: 5000,
    pesticideCost: 3000,
    marketPrice: 25.0
  })
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [analysisMode, setAnalysisMode] = useState('single') // 'single' or 'multi'

  const crops = [
    { 
      id: 'potato', 
      name: 'Potato', 
      icon: '🥔', 
      yield: 25, 
      unit: 'tonnes/acre',
      season: '90-120 days',
      marketDemand: 'High',
      defaultPrice: 25
    },
    { 
      id: 'rice', 
      name: 'Rice', 
      icon: '🌾', 
      yield: 6, 
      unit: 'tonnes/acre',
      season: '120-150 days',
      marketDemand: 'Very High',
      defaultPrice: 35
    },
    { 
      id: 'wheat', 
      name: 'Wheat', 
      icon: '🌾', 
      yield: 4, 
      unit: 'tonnes/acre',
      season: '120-140 days',
      marketDemand: 'High',
      defaultPrice: 28
    },
    { 
      id: 'tomato', 
      name: 'Tomato', 
      icon: '🍅', 
      yield: 30, 
      unit: 'tonnes/acre',
      season: '90-110 days',
      marketDemand: 'High',
      defaultPrice: 20
    },
    { 
      id: 'sugarcane', 
      name: 'Sugarcane', 
      icon: '🌿', 
      yield: 50, 
      unit: 'tonnes/acre',
      season: '365 days',
      marketDemand: 'Medium',
      defaultPrice: 3
    },
    { 
      id: 'cotton', 
      name: 'Cotton', 
      icon: '🌸', 
      yield: 1.5, 
      unit: 'tonnes/acre',
      season: '180-200 days',
      marketDemand: 'Medium',
      defaultPrice: 120
    }
  ]

  const handleInputChange = (name, value) => {
    setInputs(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }))
  }

  const addCropToAnalysis = () => {
    const crop = crops.find(c => c.id === currentCrop)
    const cropAnalysis = {
      ...crop,
      inputs: { ...inputs, marketPrice: crop.defaultPrice },
      uniqueId: `${crop.id}_${Date.now()}` // Unique ID for multiple instances
    }
    
    setSelectedCrops(prev => [...prev, cropAnalysis])
    setAnalysisMode('multi')
  }

  const removeCropFromAnalysis = (cropId) => {
    setSelectedCrops(prev => prev.filter(crop => crop.uniqueId !== cropId))
    if (selectedCrops.length === 1) {
      setAnalysisMode('single')
      setSelectedCrops([])
    }
  }

  const updateCropInput = (cropId, inputName, value) => {
    setSelectedCrops(prev => prev.map(crop => 
      crop.uniqueId === cropId 
        ? { ...crop, inputs: { ...crop.inputs, [inputName]: parseFloat(value) || 0 } }
        : crop
    ))
  }

  const calculateSingleCropProfit = (crop, inputs) => {
    const totalCosts = inputs.seedCost + inputs.fertilizerCost + inputs.laborCost + 
                      inputs.irrigationCost + inputs.pesticideCost
    const totalCostPerAcre = totalCosts * inputs.landSize
    const estimatedYield = crop.yield * inputs.landSize
    const grossRevenue = estimatedYield * 1000 * inputs.marketPrice // Convert tonnes to kg
    const netProfit = grossRevenue - totalCostPerAcre
    const profitMargin = grossRevenue > 0 ? ((netProfit / grossRevenue) * 100).toFixed(2) : 0
    const profitPerAcre = netProfit / inputs.landSize
    const breakEvenPrice = totalCostPerAcre / (estimatedYield * 1000)

    return {
      crop,
      totalCosts: totalCostPerAcre,
      grossRevenue,
      netProfit,
      profitMargin,
      profitPerAcre,
      estimatedYield,
      breakEvenPrice,
      costBreakdown: {
        seeds: inputs.seedCost * inputs.landSize,
        fertilizer: inputs.fertilizerCost * inputs.landSize,
        labor: inputs.laborCost * inputs.landSize,
        irrigation: inputs.irrigationCost * inputs.landSize,
        pesticide: inputs.pesticideCost * inputs.landSize
      }
    }
  }

  const calculateProfit = () => {
    setLoading(true)
    
    setTimeout(() => {
      if (analysisMode === 'single') {
        const crop = crops.find(c => c.id === currentCrop)
        const result = calculateSingleCropProfit(crop, inputs)
        setResults({
          type: 'single',
          data: result
        })
      } else {
        // Multi-crop analysis
        const cropResults = selectedCrops.map(cropData => {
          return calculateSingleCropProfit(cropData, cropData.inputs)
        })

        const totalProfit = cropResults.reduce((sum, result) => sum + result.netProfit, 0)
        const totalRevenue = cropResults.reduce((sum, result) => sum + result.grossRevenue, 0)
        const totalCosts = cropResults.reduce((sum, result) => sum + result.totalCosts, 0)
        const avgProfitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(2) : 0

        setResults({
          type: 'multi',
          data: {
            crops: cropResults,
            summary: {
              totalProfit,
              totalRevenue,
              totalCosts,
              avgProfitMargin,
              bestCrop: cropResults.reduce((best, current) => 
                current.profitPerAcre > best.profitPerAcre ? current : best
              ),
              worstCrop: cropResults.reduce((worst, current) => 
                current.profitPerAcre < worst.profitPerAcre ? current : worst
              )
            }
          }
        })
      }
      setLoading(false)
    }, 1500)
  }

  const getCostBreakdownChart = () => {
    if (!results) return null

    const data = results.type === 'single' ? results.data : results.data.crops[0]

    return {
      labels: ['Seeds', 'Fertilizer', 'Labor', 'Irrigation', 'Pesticides'],
      datasets: [
        {
          label: 'Cost (₹)',
          data: [
            data.costBreakdown.seeds,
            data.costBreakdown.fertilizer,
            data.costBreakdown.labor,
            data.costBreakdown.irrigation,
            data.costBreakdown.pesticide
          ],
          backgroundColor: [
            '#10b981', '#f59e0b', '#3b82f6', '#06b6d4', '#8b5cf6'
          ],
          borderWidth: 0,
          borderRadius: 8
        }
      ]
    }
  }

  const getMultiCropComparisonChart = () => {
    if (!results || results.type !== 'multi') return null

    const cropNames = results.data.crops.map(crop => crop.crop.name)
    const profits = results.data.crops.map(crop => crop.netProfit)

    return {
      labels: cropNames,
      datasets: [
        {
          label: 'Net Profit (₹)',
          data: profits,
          backgroundColor: [
            '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444'
          ],
          borderWidth: 0,
          borderRadius: 8
        }
      ]
    }
  }

  const getCropProfitabilityChart = () => {
    if (!results || results.type !== 'multi') return null

    const cropData = results.data.crops.map(crop => crop.netProfit)
    const cropNames = results.data.crops.map(crop => crop.crop.name)

    return {
      labels: cropNames,
      datasets: [
        {
          data: cropData,
          backgroundColor: [
            '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444'
          ],
          borderWidth: 0,
        }
      ]
    }
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '₹' + value.toLocaleString()
          }
        }
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl">
        <h3 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
          <span className="mr-3">💰</span>
          Multi-Crop Profit Calculator
        </h3>
        <p className="text-gray-600">
          Compare multiple crops and optimize your farming portfolio with advanced analytics.
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-gray-800">Analysis Mode</h4>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setAnalysisMode('single')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                analysisMode === 'single'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Single Crop
            </button>
            <button
              onClick={() => setAnalysisMode('multi')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                analysisMode === 'multi'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Multi-Crop Compare
            </button>
          </div>
        </div>

        {analysisMode === 'single' ? (
          // Single Crop Mode
          <div>
            <h5 className="font-medium text-gray-700 mb-3">Select Crop</h5>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {crops.map((crop) => (
                <div
                  key={crop.id}
                  onClick={() => setCurrentCrop(crop.id)}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all text-center ${
                    currentCrop === crop.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <span className="text-2xl block mb-1">{crop.icon}</span>
                  <div className="text-sm font-medium text-gray-800">{crop.name}</div>
                  <div className="text-xs text-gray-600">{crop.yield} {crop.unit}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          // Multi-Crop Mode
          <div>
            <div className="flex items-center justify-between mb-4">
              <h5 className="font-medium text-gray-700">Selected Crops ({selectedCrops.length})</h5>
              <div className="flex items-center space-x-2">
                <select
                  value={currentCrop}
                  onChange={(e) => setCurrentCrop(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                >
                  {crops.map(crop => (
                    <option key={crop.id} value={crop.id}>{crop.name}</option>
                  ))}
                </select>
                <button
                  onClick={addCropToAnalysis}
                  className="bg-green-500 text-white px-3 py-1 rounded-md text-sm hover:bg-green-600 transition-colors"
                >
                  + Add Crop
                </button>
              </div>
            </div>

            {selectedCrops.length > 0 ? (
              <div className="space-y-3">
                {selectedCrops.map((crop) => (
                  <div key={crop.uniqueId} className="bg-gray-50 p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">{crop.icon}</span>
                        <span className="font-medium text-gray-800">{crop.name}</span>
                      </div>
                      <button
                        onClick={() => removeCropFromAnalysis(crop.uniqueId)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Land (acres)</label>
                        <input
                          type="number"
                          value={crop.inputs.landSize}
                          onChange={(e) => updateCropInput(crop.uniqueId, 'landSize', e.target.value)}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                          min="0.1"
                          step="0.1"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Market Price (₹/kg)</label>
                        <input
                          type="number"
                          value={crop.inputs.marketPrice}
                          onChange={(e) => updateCropInput(crop.uniqueId, 'marketPrice', e.target.value)}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                          min="1"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Total Cost (₹/acre)</label>
                        <div className="text-sm font-medium text-gray-800 py-1">
                          ₹{(crop.inputs.seedCost + crop.inputs.fertilizerCost + crop.inputs.laborCost + 
                             crop.inputs.irrigationCost + crop.inputs.pesticideCost).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <span className="text-4xl block mb-2">🌱</span>
                <p>Add crops to start multi-crop analysis</p>
              </div>
            )}
          </div>
        )}
      </div>

      {analysisMode === 'single' && (
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-6">Investment Parameters</h4>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Land Size (Acres)
              </label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value={inputs.landSize}
                  onChange={(e) => handleInputChange('landSize', e.target.value)}
                  className="w-full h-3 bg-gradient-to-r from-green-200 to-green-500 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>0.1 acres</span>
                  <span className="font-semibold text-green-600">{inputs.landSize} acres</span>
                  <span>10 acres</span>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Seed Cost (₹/acre)
                </label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="5000"
                    max="30000"
                    step="1000"
                    value={inputs.seedCost}
                    onChange={(e) => handleInputChange('seedCost', e.target.value)}
                    className="w-full h-3 bg-gradient-to-r from-yellow-200 to-yellow-500 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="text-center">
                    <span className="font-semibold text-yellow-600">₹{inputs.seedCost.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Fertilizer Cost (₹/acre)
                </label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="3000"
                    max="20000"
                    step="500"
                    value={inputs.fertilizerCost}
                    onChange={(e) => handleInputChange('fertilizerCost', e.target.value)}
                    className="w-full h-3 bg-gradient-to-r from-green-200 to-green-500 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="text-center">
                    <span className="font-semibold text-green-600">₹{inputs.fertilizerCost.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Labor Cost (₹/acre)
                </label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="5000"
                    max="25000"
                    step="1000"
                    value={inputs.laborCost}
                    onChange={(e) => handleInputChange('laborCost', e.target.value)}
                    className="w-full h-3 bg-gradient-to-r from-blue-200 to-blue-500 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="text-center">
                    <span className="font-semibold text-blue-600">₹{inputs.laborCost.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Irrigation Cost (₹/acre)
                </label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="2000"
                    max="15000"
                    step="500"
                    value={inputs.irrigationCost}
                    onChange={(e) => handleInputChange('irrigationCost', e.target.value)}
                    className="w-full h-3 bg-gradient-to-r from-cyan-200 to-cyan-500 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="text-center">
                    <span className="font-semibold text-cyan-600">₹{inputs.irrigationCost.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Pesticide Cost (₹/acre)
                </label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="1000"
                    max="10000"
                    step="500"
                    value={inputs.pesticideCost}
                    onChange={(e) => handleInputChange('pesticideCost', e.target.value)}
                    className="w-full h-3 bg-gradient-to-r from-purple-200 to-purple-500 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="text-center">
                    <span className="font-semibold text-purple-600">₹{inputs.pesticideCost.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Market Price (₹/kg)
                </label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="10"
                    max="150"
                    step="1"
                    value={inputs.marketPrice}
                    onChange={(e) => handleInputChange('marketPrice', e.target.value)}
                    className="w-full h-3 bg-gradient-to-r from-orange-200 to-orange-500 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="text-center">
                    <span className="font-semibold text-orange-600">₹{inputs.marketPrice}/kg</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <button 
        onClick={calculateProfit}
        disabled={loading || (analysisMode === 'multi' && selectedCrops.length === 0)}
        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
      >
        {loading ? '🔄 Calculating...' : analysisMode === 'single' ? '💰 Calculate Profit' : '📊 Compare Crops'}
      </button>

      {loading && (
        <LoadingAnimation type="tractor" message="Analyzing crop profitability..." />
      )}

      {results && (
        <div className="space-y-6">
          {results.type === 'single' ? (
            // Single Crop Results
            <>
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl border border-green-200">
                <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  <span className="mr-2">📊</span>
                  Profit Analysis - {results.data.crop.name}
                </h4>
                
                <div className="grid md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">₹{results.data.netProfit.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Net Profit</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{results.data.profitMargin}%</div>
                    <div className="text-sm text-gray-600">Profit Margin</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">₹{results.data.profitPerAcre.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Profit/Acre</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">₹{results.data.breakEvenPrice.toFixed(2)}</div>
                    <div className="text-sm text-gray-600">Break-even Price/kg</div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h5 className="font-semibold text-gray-800 mb-4">Cost Breakdown</h5>
                <Bar data={getCostBreakdownChart()} options={chartOptions} />
              </div>
            </>
          ) : (
            // Multi-Crop Results
            <>
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl border border-green-200">
                <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  <span className="mr-2">📊</span>
                  Multi-Crop Analysis Summary
                </h4>
                
                <div className="grid md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">₹{results.data.summary.totalProfit.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Total Net Profit</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{results.data.summary.avgProfitMargin}%</div>
                    <div className="text-sm text-gray-600">Avg Profit Margin</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{results.data.summary.bestCrop.crop.name}</div>
                    <div className="text-sm text-gray-600">Most Profitable</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{results.data.summary.worstCrop.crop.name}</div>
                    <div className="text-sm text-gray-600">Least Profitable</div>
                  </div>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200">
                  <h5 className="font-semibold text-gray-800 mb-4">Profit Comparison</h5>
                  <Bar data={getMultiCropComparisonChart()} options={chartOptions} />
                </div>
                
                <div className="bg-white p-6 rounded-xl border border-gray-200">
                  <h5 className="font-semibold text-gray-800 mb-4">Profitability Distribution</h5>
                  <Doughnut data={getCropProfitabilityChart()} options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'bottom',
                      },
                    }
                  }} />
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h5 className="font-semibold text-gray-800 mb-4">Individual Crop Performance</h5>
                <div className="space-y-4">
                  {results.data.crops.map((cropResult, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-xl">{cropResult.crop.icon}</span>
                          <span className="font-medium text-gray-800">{cropResult.crop.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">₹{cropResult.netProfit.toLocaleString()}</div>
                          <div className="text-sm text-gray-600">{cropResult.profitMargin}% margin</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-gray-600">Revenue</div>
                          <div className="font-medium">₹{cropResult.grossRevenue.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Costs</div>
                          <div className="font-medium">₹{cropResult.totalCosts.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Yield</div>
                          <div className="font-medium">{cropResult.estimatedYield} tonnes</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Break-even</div>
                          <div className="font-medium">₹{cropResult.breakEvenPrice.toFixed(2)}/kg</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200">
            <h5 className="font-semibold text-yellow-800 mb-4 flex items-center">
              <span className="mr-2">💡</span>
              Smart Recommendations
            </h5>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <h6 className="font-medium text-yellow-800 mb-2">Cost Optimization</h6>
                <ul className="text-yellow-700 space-y-1">
                  <li>• Consider bulk purchasing for seeds and fertilizers</li>
                  <li>• Explore organic farming to reduce chemical costs</li>
                  <li>• Implement drip irrigation to save water costs</li>
                  {results.type === 'multi' && <li>• Focus on high-margin crops like {results.data.summary.bestCrop.crop.name}</li>}
                </ul>
              </div>
              <div>
                <h6 className="font-medium text-yellow-800 mb-2">Revenue Enhancement</h6>
                <ul className="text-yellow-700 space-y-1">
                  <li>• Direct market sales to eliminate middlemen</li>
                  <li>• Value addition through processing</li>
                  <li>• Contract farming for guaranteed prices</li>
                  {results.type === 'multi' && <li>• Consider crop rotation for soil health</li>}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProfitCalculatorMulti

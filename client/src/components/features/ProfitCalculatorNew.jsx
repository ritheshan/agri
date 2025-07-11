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

const ProfitCalculatorNew = () => {
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
      marketDemand: 'High'
    },
    { 
      id: 'rice', 
      name: 'Rice', 
      icon: '🌾', 
      yield: 6, 
      unit: 'tonnes/acre',
      season: '120-150 days',
      marketDemand: 'Very High'
    },
    { 
      id: 'wheat', 
      name: 'Wheat', 
      icon: '🌾', 
      yield: 4, 
      unit: 'tonnes/acre',
      season: '120-140 days',
      marketDemand: 'High'
    },
    { 
      id: 'tomato', 
      name: 'Tomato', 
      icon: '🍅', 
      yield: 30, 
      unit: 'tonnes/acre',
      season: '90-110 days',
      marketDemand: 'High'
    },
    { 
      id: 'sugarcane', 
      name: 'Sugarcane', 
      icon: '🌿', 
      yield: 50, 
      unit: 'tonnes/acre',
      season: '365 days',
      marketDemand: 'Medium'
    },
    { 
      id: 'cotton', 
      name: 'Cotton', 
      icon: '🌸', 
      yield: 1.5, 
      unit: 'tonnes/acre',
      season: '180-200 days',
      marketDemand: 'Medium'
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
      inputs: { ...inputs },
      id: `${crop.id}_${Date.now()}` // Unique ID for multiple instances
    }
    
    setSelectedCrops(prev => [...prev, cropAnalysis])
    setAnalysisMode('multi')
  }

  const removeCropFromAnalysis = (cropId) => {
    setSelectedCrops(prev => prev.filter(crop => crop.id !== cropId))
    if (selectedCrops.length === 1) {
      setAnalysisMode('single')
    }
  }

  const calculateSingleCropProfit = (crop, inputs) => {
    const totalCosts = inputs.seedCost + inputs.fertilizerCost + inputs.laborCost + 
                      inputs.irrigationCost + inputs.pesticideCost
    const totalCostPerAcre = totalCosts * inputs.landSize
    const estimatedYield = crop.yield * inputs.landSize
    const grossRevenue = estimatedYield * 1000 * inputs.marketPrice // Convert tonnes to kg
    const netProfit = grossRevenue - totalCostPerAcre
    const profitMargin = ((netProfit / grossRevenue) * 100).toFixed(2)
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
          const crop = crops.find(c => c.id === cropData.id.split('_')[0])
          return calculateSingleCropProfit(crop, cropData.inputs)
        })

        const totalProfit = cropResults.reduce((sum, result) => sum + result.netProfit, 0)
        const totalRevenue = cropResults.reduce((sum, result) => sum + result.grossRevenue, 0)
        const totalCosts = cropResults.reduce((sum, result) => sum + result.totalCosts, 0)
        const avgProfitMargin = ((totalProfit / totalRevenue) * 100).toFixed(2)

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
            '#10b981', // green
            '#f59e0b', // yellow
            '#3b82f6', // blue
            '#06b6d4', // cyan
            '#8b5cf6'  // purple
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
    const revenues = results.data.crops.map(crop => crop.grossRevenue)
    const costs = results.data.crops.map(crop => crop.totalCosts)

    return {
      labels: cropNames,
      datasets: [
        {
          label: 'Net Profit (₹)',
          data: profits,
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
          borderColor: '#10b981',
          borderWidth: 2,
        },
        {
          label: 'Total Costs (₹)',
          data: costs,
          backgroundColor: 'rgba(239, 68, 68, 0.8)',
          borderColor: '#ef4444',
          borderWidth: 2,
        }
      ]
    }
  }

  const getCropProfitabilityChart = () => {
    if (!results || results.type !== 'multi') return null

    const cropData = results.data.crops.map(crop => ({
      name: crop.crop.name,
      profit: crop.netProfit,
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`
    }))

    return {
      labels: cropData.map(crop => crop.name),
      datasets: [
        {
          data: cropData.map(crop => crop.profit),
          backgroundColor: [
            '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444'
          ],
          borderWidth: 0,
        }
      ]
    }
  }
      datasets: [
        {
          label: 'Cost (₹)',
          data: [
            results.costBreakdown.seeds,
            results.costBreakdown.fertilizer,
            results.costBreakdown.labor,
            results.costBreakdown.irrigation,
            results.costBreakdown.pesticide
          ],
          backgroundColor: [
            '#10b981', // green
            '#f59e0b', // yellow
            '#3b82f6', // blue
            '#06b6d4', // cyan
            '#8b5cf6'  // purple
          ],
          borderWidth: 0,
          borderRadius: 8
        }
      ]
    }
  }

  const getProfitProjectionChart = () => {
    if (!results) return null

    const data = results.type === 'single' ? results.data : results.data.crops[0]
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const cumulativeCosts = []
    const cumulativeRevenue = []
    
    // Simulate cost distribution over crop cycle (4 months for potato)
    const monthlyCost = data.totalCosts / 4
    const monthlyRevenue = data.grossRevenue / 4
    
    for (let i = 0; i < 12; i++) {
      if (i < 4) {
        cumulativeCosts.push(monthlyCost * (i + 1))
        cumulativeRevenue.push(0)
      } else if (i >= 4 && i < 8) {
        cumulativeCosts.push(data.totalCosts)
        cumulativeRevenue.push(monthlyRevenue * (i - 3))
      } else {
        cumulativeCosts.push(data.totalCosts)
        cumulativeRevenue.push(data.grossRevenue)
      }
    }

    return {
      labels: months,
      datasets: [
        {
          label: 'Cumulative Costs (₹)',
          data: cumulativeCosts,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: false,
          tension: 0.4
        },
        {
          label: 'Cumulative Revenue (₹)',
          data: cumulativeRevenue,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: false,
          tension: 0.4
        }
      ]
    }
  }
    
    for (let i = 0; i < 12; i++) {
      if (i < 4) {
        cumulativeCosts.push(monthlyCost * (i + 1))
        cumulativeRevenue.push(0)
      } else if (i >= 4 && i < 8) {
        cumulativeCosts.push(results.totalCosts)
        cumulativeRevenue.push(monthlyRevenue * (i - 3))
      } else {
        cumulativeCosts.push(results.totalCosts)
        cumulativeRevenue.push(results.grossRevenue)
      }
    }

    return {
      labels: months,
      datasets: [
        {
          label: 'Cumulative Costs (₹)',
          data: cumulativeCosts,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: false,
          tension: 0.4
        },
        {
          label: 'Cumulative Revenue (₹)',
          data: cumulativeRevenue,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: false,
          tension: 0.4
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
          Smart Profit Calculator
        </h3>
        <p className="text-gray-600">
          Calculate potential profits and optimize your investment decisions with data-driven insights.
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h4 className="font-semibold text-gray-800 mb-4">Select Crop</h4>
        <div className="grid grid-cols-1 gap-4">
          {crops.map((crop) => (
            <div
              key={crop.id}
              onClick={() => setSelectedCrop(crop.id)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedCrop === crop.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">{crop.icon}</span>
                  <div>
                    <h5 className="font-semibold text-gray-800">{crop.name}</h5>
                    <p className="text-sm text-gray-600">Yield: {crop.yield} {crop.unit}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Season: {crop.season}</div>
                  <div className="text-sm font-medium text-green-600">Demand: {crop.marketDemand}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

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
                  max="50"
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

        <button 
          onClick={calculateProfit}
          disabled={loading}
          className="w-full mt-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          {loading ? '🔄 Calculating...' : '💰 Calculate Profit'}
        </button>
      </div>

      {loading && (
        <LoadingAnimation type="tractor" message="Calculating profit potential..." />
      )}

      {results && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl border border-green-200">
            <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="mr-2">📊</span>
              Profit Analysis Summary
            </h4>
            
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">₹{results.netProfit.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Net Profit</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{results.profitMargin}%</div>
                <div className="text-sm text-gray-600">Profit Margin</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">₹{results.profitPerAcre.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Profit/Acre</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">₹{results.breakEvenPrice.toFixed(2)}</div>
                <div className="text-sm text-gray-600">Break-even Price/kg</div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h5 className="font-semibold text-gray-800 mb-4">Cost Breakdown</h5>
              <Bar data={getCostBreakdownChart()} options={chartOptions} />
            </div>
            
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h5 className="font-semibold text-gray-800 mb-4">Profit Projection (12 Months)</h5>
              <Line data={getProfitProjectionChart()} options={chartOptions} />
            </div>
          </div>

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
                </ul>
              </div>
              <div>
                <h6 className="font-medium text-yellow-800 mb-2">Revenue Enhancement</h6>
                <ul className="text-yellow-700 space-y-1">
                  <li>• Direct market sales to eliminate middlemen</li>
                  <li>• Value addition through processing</li>
                  <li>• Contract farming for guaranteed prices</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProfitCalculatorNew

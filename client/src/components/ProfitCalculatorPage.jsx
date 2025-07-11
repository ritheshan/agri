import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeftIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts'

const ProfitCalculatorPage = () => {
  const navigate = useNavigate()
  const [crops, setCrops] = useState([
    {
      id: 1,
      name: 'Potato',
      area: 2,
      costPerAcre: 25000,
      expectedYield: 200,
      marketPrice: 15,
      season: 'Rabi'
    }
  ])

  const [newCrop, setNewCrop] = useState({
    name: '',
    area: '',
    costPerAcre: '',
    expectedYield: '',
    marketPrice: '',
    season: 'Kharif'
  })

  const cropOptions = [
    'Potato', 'Tomato', 'Wheat', 'Rice', 'Corn', 'Sugarcane', 'Cotton', 'Onion', 'Garlic', 'Carrot',
    'Cabbage', 'Cauliflower', 'Brinjal', 'Okra', 'Chili', 'Cucumber', 'Pumpkin', 'Watermelon'
  ]

  const seasonOptions = ['Kharif', 'Rabi', 'Zaid']

  const addCrop = () => {
    if (newCrop.name && newCrop.area && newCrop.costPerAcre && newCrop.expectedYield && newCrop.marketPrice) {
      setCrops([...crops, {
        id: Date.now(),
        name: newCrop.name,
        area: parseFloat(newCrop.area),
        costPerAcre: parseFloat(newCrop.costPerAcre),
        expectedYield: parseFloat(newCrop.expectedYield),
        marketPrice: parseFloat(newCrop.marketPrice),
        season: newCrop.season
      }])
      setNewCrop({
        name: '',
        area: '',
        costPerAcre: '',
        expectedYield: '',
        marketPrice: '',
        season: 'Kharif'
      })
    }
  }

  const removeCrop = (id) => {
    setCrops(crops.filter(crop => crop.id !== id))
  }

  const calculateCropMetrics = (crop) => {
    const totalCost = crop.area * crop.costPerAcre
    const totalYield = crop.area * crop.expectedYield
    const totalRevenue = totalYield * crop.marketPrice
    const profit = totalRevenue - totalCost
    const profitPercentage = (profit / totalCost) * 100

    return {
      totalCost,
      totalYield,
      totalRevenue,
      profit,
      profitPercentage
    }
  }

  const getAllMetrics = () => {
    const metrics = crops.map(crop => ({
      ...crop,
      ...calculateCropMetrics(crop)
    }))

    const totalInvestment = metrics.reduce((sum, crop) => sum + crop.totalCost, 0)
    const totalRevenue = metrics.reduce((sum, crop) => sum + crop.totalRevenue, 0)
    const totalProfit = metrics.reduce((sum, crop) => sum + crop.profit, 0)
    const avgProfitPercentage = totalInvestment > 0 ? (totalProfit / totalInvestment) * 100 : 0

    return {
      crops: metrics,
      totalInvestment,
      totalRevenue,
      totalProfit,
      avgProfitPercentage
    }
  }

  const { crops: cropsWithMetrics, totalInvestment, totalRevenue, totalProfit, avgProfitPercentage } = getAllMetrics()

  // Chart data
  const chartData = cropsWithMetrics.map(crop => ({
    name: crop.name,
    cost: crop.totalCost,
    revenue: crop.totalRevenue,
    profit: crop.profit
  }))

  const pieData = cropsWithMetrics.map(crop => ({
    name: crop.name,
    value: crop.totalCost,
    color: `hsl(${Math.random() * 360}, 70%, 50%)`
  }))

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7300']

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
                <h1 className="text-2xl font-bold text-gray-900">Multi-Crop Profit Calculator</h1>
                <p className="text-sm text-gray-600">Calculate and compare profitability across multiple crops</p>
              </div>
            </div>
            <div className="text-4xl">💰</div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Investment</p>
                <p className="text-2xl font-bold text-red-600">₹{totalInvestment.toLocaleString()}</p>
              </div>
              <div className="text-3xl">💸</div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-blue-600">₹{totalRevenue.toLocaleString()}</p>
              </div>
              <div className="text-3xl">📈</div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Profit</p>
                <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ₹{totalProfit.toLocaleString()}
                </p>
              </div>
              <div className="text-3xl">{totalProfit >= 0 ? '💰' : '📉'}</div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Profit %</p>
                <p className={`text-2xl font-bold ${avgProfitPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {avgProfitPercentage.toFixed(1)}%
                </p>
              </div>
              <div className="text-3xl">📊</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <PlusIcon className="w-6 h-6 mr-2 text-green-600" />
              Quick Add Crop
            </h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Crop</label>
                  <div className="relative">
                    <select
                      value={newCrop.name}
                      onChange={(e) => {
                        // Preset default values based on selected crop
                        const selectedCrop = e.target.value;
                        let defaults = {};
                        
                        switch (selectedCrop) {
                          case 'Potato':
                            defaults = { costPerAcre: '25000', expectedYield: '200', marketPrice: '15' };
                            break;
                          case 'Tomato':
                            defaults = { costPerAcre: '35000', expectedYield: '250', marketPrice: '20' };
                            break;
                          case 'Wheat':
                            defaults = { costPerAcre: '15000', expectedYield: '150', marketPrice: '15' };
                            break;
                          case 'Rice':
                            defaults = { costPerAcre: '20000', expectedYield: '180', marketPrice: '18' };
                            break;
                          default:
                            defaults = {};
                        }
                        
                        setNewCrop({
                          ...newCrop, 
                          name: selectedCrop,
                          ...defaults
                        });
                      }}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white appearance-none"
                    >
                      <option value="">Select Crop</option>
                      {cropOptions.map(crop => (
                        <option key={crop} value={crop}>{crop}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Area (acres)</label>
                  <div className="relative mt-1 rounded-md shadow-sm">
                    <input
                      type="number"
                      value={newCrop.area}
                      onChange={(e) => setNewCrop({...newCrop, area: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="2"
                      min="0.1"
                      step="0.1"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">acres</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Investment (₹/acre)</label>
                  <div className="relative">
                    <select
                      value={newCrop.costPerAcre}
                      onChange={(e) => setNewCrop({...newCrop, costPerAcre: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white appearance-none"
                    >
                      <option value="">Select Range</option>
                      <option value="15000">Low (₹15,000)</option>
                      <option value="25000">Medium (₹25,000)</option>
                      <option value="35000">High (₹35,000)</option>
                      <option value="50000">Premium (₹50,000)</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Expected Yield (qtl/acre)</label>
                  <div className="relative">
                    <select
                      value={newCrop.expectedYield}
                      onChange={(e) => setNewCrop({...newCrop, expectedYield: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white appearance-none"
                    >
                      <option value="">Select Yield</option>
                      <option value="100">Low (100 qtl)</option>
                      <option value="150">Medium (150 qtl)</option>
                      <option value="200">High (200 qtl)</option>
                      <option value="250">Excellent (250 qtl)</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Market Price (₹/qtl)</label>
                  <div className="relative">
                    <select
                      value={newCrop.marketPrice}
                      onChange={(e) => setNewCrop({...newCrop, marketPrice: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white appearance-none"
                    >
                      <option value="">Select Price</option>
                      <option value="10">Low (₹10/qtl)</option>
                      <option value="15">Average (₹15/qtl)</option>
                      <option value="20">Good (₹20/qtl)</option>
                      <option value="25">Excellent (₹25/qtl)</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Season</label>
                <div className="grid grid-cols-3 gap-4">
                  {seasonOptions.map(season => (
                    <button
                      key={season}
                      type="button"
                      onClick={() => setNewCrop({...newCrop, season})}
                      className={`p-3 rounded-lg border-2 font-medium transition-all ${
                        newCrop.season === season
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 hover:border-green-300 text-gray-700'
                      }`}
                    >
                      {season === 'Kharif' && '☔️ '}
                      {season === 'Rabi' && '❄️ '}
                      {season === 'Zaid' && '☀️ '}
                      {season}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-2">
                <div className="flex -space-x-1">
                  {crops.slice(0, 5).map((crop, index) => (
                    <div 
                      key={crop.id} 
                      className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-200 border-2 border-white text-xs font-medium text-green-800"
                      title={crop.name}
                    >
                      {crop.name.charAt(0)}
                    </div>
                  ))}
                  {crops.length > 5 && (
                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 border-2 border-white text-xs font-medium text-green-800">
                      +{crops.length - 5}
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={addCrop}
                disabled={!newCrop.name || !newCrop.area || !newCrop.costPerAcre || !newCrop.expectedYield || !newCrop.marketPrice}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2 mt-4 transform hover:scale-105 transition-transform"
              >
                <PlusIcon className="w-5 h-5" />
                <span>Add {newCrop.name ? newCrop.name : "Crop"} to Comparison</span>
              </button>
              
              {crops.length > 0 && (
                <p className="text-sm text-gray-600 text-center mt-2">
                  {crops.length} crop{crops.length !== 1 ? 's' : ''} in comparison
                </p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Added Crops</h2>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {cropsWithMetrics.map(crop => (
                <div key={crop.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{crop.name}</h3>
                      <p className="text-sm text-gray-600">{crop.season} • {crop.area} acres</p>
                    </div>
                    <button
                      onClick={() => removeCrop(crop.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Investment</p>
                      <p className="font-semibold text-red-600">₹{crop.totalCost.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Revenue</p>
                      <p className="font-semibold text-blue-600">₹{crop.totalRevenue.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Profit</p>
                      <p className={`font-semibold ${crop.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₹{crop.profit.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Profit %</p>
                      <p className={`font-semibold ${crop.profitPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {crop.profitPercentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              {crops.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">🌾</div>
                  <p className="text-gray-600">No crops added yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {crops.length > 0 && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Profit Comparison</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                  <Bar dataKey="cost" fill="#EF4444" name="Cost" />
                  <Bar dataKey="revenue" fill="#3B82F6" name="Revenue" />
                  <Bar dataKey="profit" fill="#10B981" name="Profit" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Investment Distribution</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <span className="mr-2">💡</span>
            Profit Optimization Tips
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/80 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">🌱 Crop Selection</h3>
              <p className="text-sm text-gray-700">Choose crops with higher profit margins and suitable for your region's climate.</p>
            </div>
            <div className="bg-white/80 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">📊 Market Research</h3>
              <p className="text-sm text-gray-700">Monitor market prices and demand trends before planting.</p>
            </div>
            <div className="bg-white/80 rounded-lg p-4">
              <h3 className="font-semibold text-purple-800 mb-2">🔄 Crop Rotation</h3>
              <p className="text-sm text-gray-700">Implement crop rotation to improve soil health and reduce pest issues.</p>
            </div>
            <div className="bg-white/80 rounded-lg p-4">
              <h3 className="font-semibold text-orange-800 mb-2">⚡ Cost Management</h3>
              <p className="text-sm text-gray-700">Optimize input costs through bulk purchasing and efficient resource utilization.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfitCalculatorPage

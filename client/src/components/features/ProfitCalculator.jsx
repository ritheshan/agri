import { useState } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import LoadingAnimation from '../LoadingAnimation'
import './ProfitCalculator.css'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

const ProfitCalculator = () => {
  const [selectedCrops, setSelectedCrops] = useState([])
  const [inputs, setInputs] = useState({
    landSize: '',
    laborCost: '',
    seedCost: '',
    fertilizerCost: '',
    irrigationCost: '',
    marketPrice: ''
  })
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)

  const crops = [
    { id: 'wheat', name: 'Wheat', icon: '🌾', avgYield: 3.5, growthPeriod: 120 },
    { id: 'corn', name: 'Corn', icon: '🌽', avgYield: 8.2, growthPeriod: 100 },
    { id: 'potato', name: 'Potato', icon: '🥔', avgYield: 25.3, growthPeriod: 90 },
    { id: 'tomato', name: 'Tomato', icon: '🍅', avgYield: 40.1, growthPeriod: 75 },
    { id: 'carrot', name: 'Carrot', icon: '🥕', avgYield: 30.2, growthPeriod: 70 },
    { id: 'lettuce', name: 'Lettuce', icon: '🥬', avgYield: 15.8, growthPeriod: 45 },
    { id: 'rice', name: 'Rice', icon: '🌾', avgYield: 4.1, growthPeriod: 150 },
    { id: 'onion', name: 'Onion', icon: '🧅', avgYield: 18.5, growthPeriod: 100 }
  ]

  const handleCropSelect = (crop) => {
    setSelectedCrops(prev => {
      const isSelected = prev.find(c => c.id === crop.id)
      if (isSelected) {
        return prev.filter(c => c.id !== crop.id)
      } else {
        return [...prev, crop]
      }
    })
  }

  const handleInputChange = (e) => {
    setInputs({
      ...inputs,
      [e.target.name]: e.target.value
    })
  }

  const calculateProfit = () => {
    if (selectedCrops.length === 0) {
      alert('Please select at least one crop')
      return
    }

    setLoading(true)
    
    // Simulate calculation delay
    setTimeout(() => {
      const calculations = selectedCrops.map(crop => {
        const landSize = parseFloat(inputs.landSize) || 1
        const laborCost = parseFloat(inputs.laborCost) || 500
        const seedCost = parseFloat(inputs.seedCost) || 200
        const fertilizerCost = parseFloat(inputs.fertilizerCost) || 300
        const irrigationCost = parseFloat(inputs.irrigationCost) || 150
        const marketPrice = parseFloat(inputs.marketPrice) || 1000
        
        const totalCosts = (laborCost + seedCost + fertilizerCost + irrigationCost) * landSize
        const estimatedYield = crop.avgYield * landSize
        const totalRevenue = estimatedYield * marketPrice
        const profit = totalRevenue - totalCosts
        const profitMargin = ((profit / totalRevenue) * 100).toFixed(2)
        const roiPeriod = (totalCosts / (profit / 12)).toFixed(1)

        return {
          ...crop,
          costs: totalCosts,
          revenue: totalRevenue,
          profit: profit,
          profitMargin: profitMargin,
          estimatedYield: estimatedYield.toFixed(2),
          roiPeriod: roiPeriod
        }
      })

      setResults(calculations.sort((a, b) => b.profit - a.profit))
      setLoading(false)
    }, 1500)
  }

  const getChartData = () => {
    if (!results) return null

    return {
      labels: results.map(r => r.name),
      datasets: [
        {
          label: 'Profit ($)',
          data: results.map(r => r.profit),
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4
        },
        {
          label: 'Revenue ($)',
          data: results.map(r => r.revenue),
          borderColor: '#fde047',
          backgroundColor: 'rgba(253, 224, 71, 0.1)',
          borderWidth: 3,
          fill: true,
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
      title: {
        display: true,
        text: 'Crop Profitability Analysis',
        font: {
          size: 16,
          weight: 'bold'
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '$' + value.toLocaleString()
          }
        }
      }
    }
  }

  return (
    <div className="profit-calculator">
      <h2>💰 Crop Profit Calculator</h2>
      <p>Select crops and input your farming costs to calculate potential profits and compare different crops.</p>
      
      <div className="crop-selection">
        <h3>Select Crops to Compare</h3>
        <div className="crop-grid">
          {crops.map(crop => (
            <div 
              key={crop.id}
              className={`crop-card ${selectedCrops.find(c => c.id === crop.id) ? 'selected' : ''}`}
              onClick={() => handleCropSelect(crop)}
            >
              <div className="crop-icon">{crop.icon}</div>
              <div className="crop-name">{crop.name}</div>
              <div className="crop-details">
                <small>{crop.avgYield} tons/hectare</small>
                <small>{crop.growthPeriod} days</small>
              </div>
            </div>
          ))}
        </div>
        <p className="selection-info">
          Selected: {selectedCrops.length} crop{selectedCrops.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="inputs-section">
        <h3>Farming Inputs</h3>
        <div className="inputs-grid">
          <div className="input-group">
            <label htmlFor="landSize">Land Size (hectares)</label>
            <input
              type="number"
              id="landSize"
              name="landSize"
              value={inputs.landSize}
              onChange={handleInputChange}
              placeholder="1.0"
              step="0.1"
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="laborCost">Labor Cost per hectare ($)</label>
            <input
              type="number"
              id="laborCost"
              name="laborCost"
              value={inputs.laborCost}
              onChange={handleInputChange}
              placeholder="500"
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="seedCost">Seed Cost per hectare ($)</label>
            <input
              type="number"
              id="seedCost"
              name="seedCost"
              value={inputs.seedCost}
              onChange={handleInputChange}
              placeholder="200"
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="fertilizerCost">Fertilizer Cost per hectare ($)</label>
            <input
              type="number"
              id="fertilizerCost"
              name="fertilizerCost"
              value={inputs.fertilizerCost}
              onChange={handleInputChange}
              placeholder="300"
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="irrigationCost">Irrigation Cost per hectare ($)</label>
            <input
              type="number"
              id="irrigationCost"
              name="irrigationCost"
              value={inputs.irrigationCost}
              onChange={handleInputChange}
              placeholder="150"
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="marketPrice">Market Price per ton ($)</label>
            <input
              type="number"
              id="marketPrice"
              name="marketPrice"
              value={inputs.marketPrice}
              onChange={handleInputChange}
              placeholder="1000"
            />
          </div>
        </div>
        
        <button 
          className="calculate-btn"
          onClick={calculateProfit}
          disabled={loading || selectedCrops.length === 0}
        >
          {loading ? (
            <>
              <span className="loading-spinner"></span>
              Calculating...
            </>
          ) : (
            'Calculate Profits'
          )}
        </button>
      </div>

      {loading && (
        <LoadingAnimation type="tractor" message="Calculating profit potential..." />
      )}

      {results && (
        <div className="results-section">
          <h3>Profitability Analysis</h3>
          
          <div className="chart-container">
            <Line data={getChartData()} options={chartOptions} />
          </div>
          
          <div className="results-table">
            <div className="table-header">
              <div>Crop</div>
              <div>Yield (tons)</div>
              <div>Revenue ($)</div>
              <div>Costs ($)</div>
              <div>Profit ($)</div>
              <div>Margin (%)</div>
              <div>ROI Period (months)</div>
            </div>
            
            {results.map((result, index) => (
              <div key={result.id} className={`table-row ${index === 0 ? 'best-option' : ''}`}>
                <div className="crop-cell">
                  <span className="crop-icon">{result.icon}</span>
                  <span>{result.name}</span>
                  {index === 0 && <span className="best-badge">🏆 Best</span>}
                </div>
                <div>{result.estimatedYield}</div>
                <div>${result.revenue.toLocaleString()}</div>
                <div>${result.costs.toLocaleString()}</div>
                <div className={result.profit > 0 ? 'profit-positive' : 'profit-negative'}>
                  ${result.profit.toLocaleString()}
                </div>
                <div>{result.profitMargin}%</div>
                <div>{result.roiPeriod}</div>
              </div>
            ))}
          </div>
          
          <div className="recommendations">
            <h4>💡 Recommendations</h4>
            <div className="recommendation-cards">
              <div className="recommendation-card">
                <div className="rec-icon">🏆</div>
                <h5>Most Profitable</h5>
                <p>{results[0]?.name} offers the highest profit potential with ${results[0]?.profit.toLocaleString()} profit.</p>
              </div>
              
              <div className="recommendation-card">
                <div className="rec-icon">⚡</div>
                <h5>Fastest ROI</h5>
                <p>{results.sort((a, b) => parseFloat(a.roiPeriod) - parseFloat(b.roiPeriod))[0]?.name} has the fastest return on investment.</p>
              </div>
              
              <div className="recommendation-card">
                <div className="rec-icon">📊</div>
                <h5>Best Margin</h5>
                <p>{results.sort((a, b) => parseFloat(b.profitMargin) - parseFloat(a.profitMargin))[0]?.name} has the highest profit margin.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProfitCalculator

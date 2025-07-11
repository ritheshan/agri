import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import HomePageNew from './components/HomePageNew'
import DashboardNew from './components/DashboardNew'
import Community from './components/Community'
import Login from './components/Login'
import Profile from './components/Profile'
import DiseaseDetectionPage from './components/DiseaseDetectionPage'
import ProfitCalculatorPage from './components/ProfitCalculatorPage'
import Chatbot from './components/Chatbot'
import PrivateRoute from './components/PrivateRoute'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<HomePageNew />} />
            <Route path="/login" element={<Login />} />
            <Route path="/disease-detection" element={<DiseaseDetectionPage />} />
            
            <Route element={<PrivateRoute />}>
              <Route path="/dashboard" element={<DashboardNew />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profit-calculator" element={<ProfitCalculatorPage />} />
              <Route path="/community" element={<Community />} />
            </Route>
          </Routes>
          
          <Chatbot />
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './hooks/useAuth'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import NEODetails from './pages/NEODetails'
import Astrobook from './pages/Astrobook'
import Community from './pages/Community'
import './App.css'

function App() {
  const { token } = useAuthStore()

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/astrobook" element={<Astrobook />} />
        <Route path="/community" element={token ? <Community /> : <Navigate to="/login" />} />
        <Route path="/neo/:neoId" element={<NEODetails />} />
      </Routes>
    </Router>
  )
}

export default App


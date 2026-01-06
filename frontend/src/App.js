import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import Lenis from 'lenis';
import '@/App.css';
import HomePage from './pages/HomePage';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './components/AdminLogin';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function AppContent() {
  const navigate = useNavigate();
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smooth: true,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    const token = localStorage.getItem('admin_token');
    if (token) {
      axios.get(`${API}/admin/verify`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(() => setIsAuthenticated(true))
      .catch(() => {
        localStorage.removeItem('admin_token');
        setIsAuthenticated(false);
      });
    }

    return () => lenis.destroy();
  }, []);

  const handleCreditsClick = () => {
    setClickCount(prev => prev + 1);
    if (clickCount + 1 >= 3) {
      setShowAdminLogin(true);
      setClickCount(0);
    }
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setShowAdminLogin(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setIsAuthenticated(false);
    navigate('/');
  };

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<HomePage onCreditsClick={handleCreditsClick} />} />
        <Route 
          path="/admin" 
          element={
            isAuthenticated ? 
            <AdminDashboard onLogout={handleLogout} /> : 
            <HomePage onCreditsClick={handleCreditsClick} />
          } 
        />
      </Routes>

      {showAdminLogin && (
        <AdminLogin 
          onClose={() => setShowAdminLogin(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;

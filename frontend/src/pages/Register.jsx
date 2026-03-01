import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../hooks/useAuth';
import '../styles/Login.css';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const { register, loading } = useAuthStore();
  const navigate = useNavigate();

  // Generate stars and shooting stars on component mount
  useEffect(() => {
    const starsContainer = document.getElementById('stars');
    if (starsContainer) {
      starsContainer.innerHTML = '';
      
      // Static twinkling stars
      for (let i = 0; i < 200; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        const size = Math.random() * 2 + 1 + 'px';
        star.style.width = size;
        star.style.height = size;
        star.style.setProperty('--duration', (Math.random() * 3 + 1) + 's');
        starsContainer.appendChild(star);
      }

      // Shooting stars interval
      const createShootingStar = () => {
        const star = document.createElement('div');
        star.className = 'shooting-star';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 60 + '%'; // Mostly top half
        const angle = Math.random() * 45;
        star.style.transform = `rotate(${angle}deg)`;
        starsContainer.appendChild(star);
        
        // Trigger animation
        star.style.animation = 'shoot 3s ease-in-out';
        
        setTimeout(() => {
          star.remove();
        }, 3000);
      };

      const shootingStarInterval = setInterval(createShootingStar, 4000);
      return () => clearInterval(shootingStarInterval);
    }
  }, []);

  const handleMouseMove = (e) => {
    const stars = document.getElementById('stars');
    const loginForm = document.querySelector('.login-container');
    
    if (stars && loginForm) {
      const x = (window.innerWidth - e.pageX * 2) / 100;
      const y = (window.innerHeight - e.pageY * 2) / 100;
      
      stars.style.transform = `translateX(${x}px) translateY(${y}px)`;
      loginForm.style.transform = `translateX(${-x / 2}px) translateY(${-y / 2}px)`;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      await register(username, email, password, confirmPassword);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-page" onMouseMove={handleMouseMove}>
      <div className="stars" id="stars"></div>
      
      <div className="login-container">
        <h2 className="clickable-title" onClick={() => navigate('/')} style={{ whiteSpace: 'nowrap' }}>Cosmic Watch</h2>
        
        {error && <div className="auth-error-message">{error}</div>}
        
        <form id="registerForm" onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="input-group">
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="input-group">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="input-group">
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Joining...' : 'Join Mission'}
          </button>
        </form>
        
        <div className="register-link">
          Already a watcher? <span onClick={() => navigate('/login')}>Login here</span>
        </div>
      </div>
    </div>
  );
}

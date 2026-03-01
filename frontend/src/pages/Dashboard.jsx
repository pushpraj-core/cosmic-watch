import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../hooks/useAuth';
import { useNEOStore } from '../hooks/useNEO';
import BabylonSpaceVis from '../components/BabylonSpaceVis';
import '../styles/Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, token, logout } = useAuthStore();
  const { neos = [], loading, fetchNEOsFromNASA } = useNEOStore();
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNeo, setSelectedNeo] = useState(null);

  useEffect(() => {
    // Fetch NEOs from NASA API
    fetchNEOsFromNASA(token);
  }, [token, navigate, fetchNEOsFromNASA]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredNeos = neos.filter(neo => {
    const matchesFilter = 
      filter === 'all' || 
      (filter === 'hazardous' && neo.isPotentiallyHazardous) ||
      (filter === 'critical' && neo.riskLevel === 'CRITICAL') ||
      (filter === 'high' && neo.riskLevel === 'HIGH');
    
    const matchesSearch = neo.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-left">
          <h1 className="clickable-title" onClick={() => navigate('/')} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && navigate('/')}>🌌 Cosmic Watch</h1>
          <p>Real-Time Asteroid Monitoring</p>
        </div>
        <div className="header-right">
          <span className="user-info">Welcome, {user?.username || 'Guest'}!</span>
          {token && (
            <button 
              className="nav-btn" 
              onClick={() => navigate('/community')}
              style={{
                marginRight: '10px',
                padding: '8px 16px',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Community
            </button>
          )}
          {token ? (
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          ) : (
            <button className="logout-btn" onClick={() => navigate('/login')}>Login</button>
          )}
        </div>
      </header>

      <div className="dashboard-content">
        <aside className="sidebar">
          <h3>Filters</h3>
          
          <div className="filter-section">
            <h4>Risk Level</h4>
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All Objects
            </button>
            <button
              className={`filter-btn ${filter === 'hazardous' ? 'active' : ''}`}
              onClick={() => setFilter('hazardous')}
            >
              Potentially Hazardous
            </button>
            <button
              className={`filter-btn ${filter === 'critical' ? 'active' : ''}`}
              onClick={() => setFilter('critical')}
            >
              Critical
            </button>
            <button
              className={`filter-btn ${filter === 'high' ? 'active' : ''}`}
              onClick={() => setFilter('high')}
            >
              High Risk
            </button>
          </div>

          <div className="filter-section">
            <input
              type="text"
              placeholder="Search asteroids..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </aside>

        <main className="main-content">

          <div className="vis-shell">
            {loading ? (
               <div className="loading">Loading 3D Universe...</div>
            ) : (
              <>
                <BabylonSpaceVis neos={filteredNeos} onSelectNeo={setSelectedNeo} selectedNeo={selectedNeo} />
                
                {selectedNeo && (
                  <div className="neo-detail-overlay" style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    width: '300px',
                    backgroundColor: 'rgba(16, 20, 30, 0)',
                    padding: '20px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.12)',
                    zIndex: 100,
                    backdropFilter: 'blur(10px)',
                    boxShadow: 'none'
                  }}>
                    <button className="close-btn" onClick={() => setSelectedNeo(null)} style={{
                        position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', color: '#888', fontSize: '1.2rem', cursor: 'pointer'
                    }}>×</button>
                    <h2 style={{margin: '0 0 10px 0', fontSize: '1.4rem'}}>{selectedNeo.name}</h2>
                    <div className={`risk-badge ${selectedNeo.riskLevel?.toLowerCase() || ''}`} style={{display:'inline-block', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold', marginBottom:'15px', background: '#333'}}>
                      {selectedNeo.isEarth ? 'HOME PLANET' : (selectedNeo.riskLevel || 'UNKNOWN RISK')}
                    </div>
                    
                    <div className="detail-grid" style={{display:'grid', gap:'10px'}}>
                      {selectedNeo.isEarth ? (
                        <>
                          <div className="detail-item" style={{display:'flex', justifyContent:'space-between'}}>
                            <label style={{color:'#888'}}>Orbit Speed</label>
                            <span>{'29.78 km/s'}</span>
                          </div>
                          <div className="detail-item" style={{display:'flex', justifyContent:'space-between'}}>
                            <label style={{color:'#888'}}>Tilt</label>
                            <span>{'23.44° axial'}</span>
                          </div>
                          <div className="detail-item" style={{display:'flex', justifyContent:'space-between'}}>
                            <label style={{color:'#888'}}>Orbital Period</label>
                            <span>{'365.25 days'}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          {(() => {
                            const diameter = selectedNeo.estimatedDiameter?.max;
                            if (diameter === undefined || diameter === null) return null;
                            return (
                              <div className="detail-item" style={{display:'flex', justifyContent:'space-between'}}>
                                <label style={{color:'#888'}}>Diameter</label>
                                <span>{`${Math.round(diameter)}m`}</span>
                              </div>
                            );
                          })()}

                          {(() => {
                            const miss = selectedNeo?.closeApproachDates?.[0]?.missDistance?.km
                              || selectedNeo?.missDistance?.kilometers
                              || selectedNeo?.missDistance?.km;
                            if (miss === undefined || miss === null) return null;
                            const formatted = isNaN(Number(miss)) ? miss : `${Number(miss).toFixed(0)} km`;
                            return (
                              <div className="detail-item" style={{display:'flex', justifyContent:'space-between'}}>
                                <label style={{color:'#888'}}>Miss Distance</label>
                                <span>{formatted}</span>
                              </div>
                            );
                          })()}

                          {(() => {
                            if (selectedNeo.isPotentiallyHazardous === undefined) return null;
                            return (
                              <div className="detail-item" style={{display:'flex', justifyContent:'space-between'}}>
                                <label style={{color:'#888'}}>Hazardous</label>
                                <span style={{ color: selectedNeo.isPotentiallyHazardous ? '#ff4444' : '#44ff44', fontWeight:'bold' }}>
                                  {selectedNeo.isPotentiallyHazardous ? 'YES' : 'NO'}
                                </span>
                              </div>
                            );
                          })()}

                          {(() => {
                            const v = selectedNeo?.closeApproachDates?.[0]?.relativeVelocity?.kmPerHour
                              || selectedNeo?.velocity?.kilometersPerHour
                              || selectedNeo?.speed;
                            if (v === undefined || v === null) return null;
                            const formatted = isNaN(Number(v)) ? v : `${Number(v).toFixed(2)} km/h`;
                            return (
                              <div className="detail-item" style={{display:'flex', justifyContent:'space-between'}}>
                                <label style={{color:'#888'}}>Speed</label>
                                <span>{formatted}</span>
                              </div>
                            );
                          })()}

                          {(() => {
                            const p = selectedNeo.collisionProbability ?? selectedNeo.collision_probability;
                            if (p === undefined || p === null) return null;
                            return (
                              <div className="detail-item" style={{display:'flex', justifyContent:'space-between'}}>
                                 <label style={{color:'#888'}}>Collision Probability</label>
                                 <span>{`${p}%`}</span>
                              </div>
                            );
                          })()}
                        </>
                      )}
                    </div>

                    <div className="action-buttons" style={{marginTop:'20px', display: 'grid', gap: '10px'}}>
                       {!selectedNeo.isEarth && (
                         <>
                           <button
                             className="view-full-btn"
                             onClick={() => navigate(`/neo/${selectedNeo.neoId}`, { state: { neo: selectedNeo } })}
                             style={{
                               width: '100%', padding: '10px', background: 'linear-gradient(135deg, #0c0f1a 0%, #1a1f33 100%)', color: '#e8ebff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 6px 18px rgba(0,0,0,0.5)'
                             }}
                           >
                             Analysis
                           </button>
                           <button
                             className="view-full-btn"
                             onClick={() => {
                               if (token) {
                                 navigate('/community', { state: { neo: selectedNeo } });
                               } else {
                                 navigate('/login');
                               }
                             }}
                             style={{
                               width: '100%', padding: '10px', background: 'linear-gradient(135deg, #0f1526 0%, #1f2a44 100%)', color: '#e8ebff', border: '1px solid rgba(0,200,255,0.3)', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 6px 18px rgba(0,0,0,0.5)'
                             }}
                           >
                             Chat
                           </button>
                         </>
                       )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

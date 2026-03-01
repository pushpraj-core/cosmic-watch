import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNEOStore } from '../hooks/useNEO';
import { useAuthStore } from '../hooks/useAuth';
import '../styles/Astrobook.css';

export default function Astrobook() {
  const navigate = useNavigate();
  const { neos = [], loading, fetchNEOsFromNASA } = useNEOStore();
  const { token } = useAuthStore();
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');

  useEffect(() => {
    if (neos.length === 0) {
      fetchNEOsFromNASA(token);
    }
  }, [token, fetchNEOsFromNASA, neos.length]);

  const filteredNeos = neos
    .filter((neo) => {
      const matchesFilter =
        filter === 'all' ||
        (filter === 'hazardous' && neo.isPotentiallyHazardous) ||
        (filter === 'critical' && neo.riskLevel === 'CRITICAL') ||
        (filter === 'high' && neo.riskLevel === 'HIGH') ||
        (filter === 'medium' && neo.riskLevel === 'MEDIUM');
      const matchesSearch = neo.name?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesFilter && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'size') {
        return (b.estimatedDiameter?.max || 0) - (a.estimatedDiameter?.max || 0);
      }
      if (sortBy === 'risk') {
        const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        return (order[a.riskLevel] ?? 4) - (order[b.riskLevel] ?? 4);
      }
      return 0;
    });

  const getRiskColor = (level) => {
    switch (level) {
      case 'CRITICAL': return '#ff2255';
      case 'HIGH': return '#ff6633';
      case 'MEDIUM': return '#ffaa00';
      case 'LOW': return '#00d4aa';
      default: return '#64748b';
    }
  };

  const formatDistance = (neo) => {
    const km =
      neo?.closeApproachDates?.[0]?.missDistance?.km ||
      neo?.missDistance?.kilometers ||
      neo?.missDistance?.km;
    if (!km) return '—';
    return `${Number(km).toLocaleString(undefined, { maximumFractionDigits: 0 })} km`;
  };

  const formatSpeed = (neo) => {
    const v =
      neo?.closeApproachDates?.[0]?.relativeVelocity?.kmPerHour ||
      neo?.velocity?.kilometersPerHour ||
      neo?.speed;
    if (!v) return '—';
    return `${Number(v).toLocaleString(undefined, { maximumFractionDigits: 0 })} km/h`;
  };

  const formatDate = (neo) => {
    const d = neo?.closeApproachDates?.[0]?.date || neo?.closeApproachDate;
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="astrobook-page">
      {/* Starfield */}
      <div className="astrobook-stars" aria-hidden="true" />

      {/* Header */}
      <header className="astrobook-header">
        <div className="astrobook-header-left">
          <button className="back-btn" onClick={() => navigate('/')}>
            ← Home
          </button>
          <h1>Astrobook</h1>
          <span className="subtitle">Near-Earth Object Catalogue</span>
        </div>
        <div className="astrobook-header-right">
          <button className="header-action" onClick={() => navigate('/dashboard')}>
            3D View
          </button>
          {token ? (
            <button className="header-action" onClick={() => navigate('/community')}>
              Community
            </button>
          ) : (
            <button className="header-action accent" onClick={() => navigate('/login')}>
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* Toolbar */}
      <div className="astrobook-toolbar">
        <div className="toolbar-search">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search asteroids by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="toolbar-filters">
          {['all', 'hazardous', 'critical', 'high', 'medium'].map((f) => (
            <button
              key={f}
              className={`filter-chip ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className="toolbar-sort">
          <label>Sort by</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="name">Name</option>
            <option value="size">Diameter</option>
            <option value="risk">Risk Level</option>
          </select>
        </div>
      </div>

      {/* Count bar */}
      <div className="astrobook-count">
        <span>{filteredNeos.length} asteroid{filteredNeos.length !== 1 ? 's' : ''} found</span>
      </div>

      {/* Main list */}
      <main className="astrobook-list">
        {loading ? (
          <div className="astrobook-loading">
            <div className="spinner" />
            <p>Fetching asteroid data from NASA...</p>
          </div>
        ) : filteredNeos.length === 0 ? (
          <div className="astrobook-empty">
            <p>No asteroids match your search.</p>
          </div>
        ) : (
          filteredNeos.map((neo) => (
            <article
              key={neo.neoId || neo._id}
              className={`neo-card ${neo.isPotentiallyHazardous ? 'hazardous' : ''}`}
              onClick={() => navigate(`/neo/${neo.neoId}`, { state: { neo } })}
              role="button"
              tabIndex={0}
              onKeyDown={(e) =>
                e.key === 'Enter' && navigate(`/neo/${neo.neoId}`, { state: { neo } })
              }
            >
              {/* Risk ribbon */}
              <div
                className="risk-ribbon"
                style={{ backgroundColor: getRiskColor(neo.riskLevel) }}
              />

              <div className="neo-card-body">
                <div className="neo-card-top">
                  <h2>{neo.name}</h2>
                  <span
                    className="risk-tag"
                    style={{
                      color: getRiskColor(neo.riskLevel),
                      borderColor: getRiskColor(neo.riskLevel),
                    }}
                  >
                    {neo.riskLevel || 'UNKNOWN'}
                  </span>
                </div>

                <div className="neo-card-stats">
                  <div className="stat-item">
                    <span className="stat-label">Diameter</span>
                    <span className="stat-value">
                      {neo.estimatedDiameter?.max
                        ? `${Math.round(neo.estimatedDiameter.max)} m`
                        : '—'}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Miss Distance</span>
                    <span className="stat-value">{formatDistance(neo)}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Velocity</span>
                    <span className="stat-value">{formatSpeed(neo)}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Approach Date</span>
                    <span className="stat-value">{formatDate(neo)}</span>
                  </div>
                </div>

                <div className="neo-card-footer">
                  {neo.isPotentiallyHazardous && (
                    <span className="hazard-badge">⚠ Potentially Hazardous</span>
                  )}
                  <span className="view-details">View Details →</span>
                </div>
              </div>
            </article>
          ))
        )}
      </main>
    </div>
  );
}

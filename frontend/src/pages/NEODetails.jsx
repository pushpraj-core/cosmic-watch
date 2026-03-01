import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../hooks/useAuth';
import { useNEOStore } from '../hooks/useNEO';
import '../styles/NEODetails.css';

export default function NEODetails() {
  const { neoId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const { watchNeo, unwatchNeo } = useNEOStore();
  
  const [neo, setNeo] = useState(location.state?.neo || null);
  const [isWatching, setIsWatching] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch NEO from API if navigated directly (no state passed)
  useEffect(() => {
    if (!neo && neoId) {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      fetch(`${API_URL}/neo/${neoId}`)
        .then((res) => res.ok ? res.json() : null)
        .then((data) => { if (data) setNeo(data); })
        .catch(() => {});
    }
  }, [neo, neoId]);

  // Build simple chart data for history/velocity/miss distance (fallback to limited points)
  const approaches = (neo?.closeApproachDates || []).slice(0, 8);
  const missSeries = approaches.map((a) => Number(a?.missDistance?.km) || 0);
  const velocitySeries = approaches.map((a) => Number(a?.relativeVelocity?.kmPerHour) || 0);

  const buildSparkline = (series, width = 280, height = 80) => {
    if (!series.length) return '';
    const max = Math.max(...series);
    const min = Math.min(...series);
    const span = max - min || 1;
    return series
      .map((v, i) => {
        const x = (i / Math.max(series.length - 1, 1)) * width;
        const y = height - ((v - min) / span) * height;
        return `${x},${y}`;
      })
      .join(' ');
  };

  const formatAxisValue = (val) => {
    if (val >= 1e9) return `${(val / 1e9).toFixed(1)}B`;
    if (val >= 1e6) return `${(val / 1e6).toFixed(1)}M`;
    if (val >= 1e3) return `${(val / 1e3).toFixed(1)}K`;
    return val.toFixed(0);
  };

  const formatShortDate = (dateStr) => {
    const d = new Date(dateStr);
    if (isNaN(d)) return '';
    const m = d.getMonth() + 1;
    const yr = d.getFullYear();
    return `${m}/${yr}`;
  };

  const ChartPanel = ({ title, series, dates, color }) => {
    if (!series.length) return null;
    const padL = 60;
    const padR = 20;
    const padT = 16;
    const padB = 48;
    const W = 560;
    const H = 180;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;

    const max = Math.max(...series);
    const min = Math.min(...series);
    const span = max - min || 1;

    const points = series.map((v, i) => {
      const x = padL + (i / Math.max(series.length - 1, 1)) * plotW;
      const y = padT + plotH - ((v - min) / span) * plotH;
      return { x, y, val: v };
    });

    const polyline = points.map((p) => `${p.x},${p.y}`).join(' ');
    const areaPath = `M${points[0].x},${padT + plotH} ${points.map((p) => `L${p.x},${p.y}`).join(' ')} L${points[points.length - 1].x},${padT + plotH} Z`;

    // Y-axis ticks (5 ticks)
    const yTicks = Array.from({ length: 5 }, (_, i) => {
      const val = min + (span * i) / 4;
      const y = padT + plotH - (i / 4) * plotH;
      return { val, y };
    });

    // X-axis labels (show max 6 evenly spaced)
    const maxLabels = Math.min(6, dates.length);
    const step = Math.max(1, Math.floor((dates.length - 1) / (maxLabels - 1)));
    const xLabels = [];
    for (let i = 0; i < dates.length; i += step) {
      const x = padL + (i / Math.max(dates.length - 1, 1)) * plotW;
      xLabels.push({ x, label: formatShortDate(dates[i]?.date) });
    }

    return (
      <div className="chart-panel">
        <h4 className="chart-title">{title}</h4>
        <svg viewBox={`0 0 ${W} ${H}`} className="chart-svg">
          {/* gridlines */}
          {yTicks.map((t, i) => (
            <line key={i} x1={padL} y1={t.y} x2={W - padR} y2={t.y} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
          ))}
          {/* Y axis labels */}
          {yTicks.map((t, i) => (
            <text key={i} x={padL - 8} y={t.y + 4} textAnchor="end" fill="#64748b" fontSize="10" fontFamily="inherit">
              {formatAxisValue(t.val)}
            </text>
          ))}
          {/* area fill */}
          <path d={areaPath} fill={`${color}15`} />
          {/* line */}
          <polyline fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={polyline} />
          {/* data dots */}
          {points.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="4" fill="#060a14" stroke={color} strokeWidth="2" />
              <title>{`${formatShortDate(dates[i]?.date)}: ${p.val.toLocaleString()}`}</title>
            </g>
          ))}
          {/* X axis labels */}
          {xLabels.map((l, i) => (
            <text key={i} x={l.x} y={H - 8} textAnchor="middle" fill="#64748b" fontSize="10" fontFamily="inherit">
              {l.label}
            </text>
          ))}
          {/* axes lines */}
          <line x1={padL} y1={padT} x2={padL} y2={padT + plotH} stroke="rgba(255,255,255,0.1)" />
          <line x1={padL} y1={padT + plotH} x2={W - padR} y2={padT + plotH} stroke="rgba(255,255,255,0.1)" />
        </svg>
      </div>
    );
  };

  const handleWatch = async () => {
    if (!neo) return;
    if (!token) {
      navigate('/login');
      return;
    }
    
    try {
      setLoading(true);
      if (isWatching) {
        await unwatchNeo(neo.neoId, token);
      } else {
        await watchNeo(neo.neoId, neo.name, token);
      }
      setIsWatching(!isWatching);
    } catch (error) {
      console.error('Error toggling watch:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!token) {
      navigate('/login');
      return;
    }
    if (!newMessage.trim()) return;

    const message = {
      id: Date.now(),
      username: user.username,
      text: newMessage,
      timestamp: new Date()
    };

    setMessages([...messages, message]);
    setNewMessage('');
  };

  if (!neo) {
    return <div className="loading">Loading NEO details...</div>;
  }

  return (
    <div className="neo-details-container">
      <button className="back-btn" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="details-grid">
        <aside className="details-sidebar">
          <div className="neo-card-large">
            <h2>{neo.name}</h2>
            
            <div className="risk-indicator">
              <div className="risk-circle" style={{
                background: neo.riskLevel === 'CRITICAL' ? '#ff6b6b' :
                           neo.riskLevel === 'HIGH' ? '#ffc107' :
                           neo.riskLevel === 'MEDIUM' ? '#ffb700' : '#00d4ff'
              }}>
                {neo.riskScore}
              </div>
              <span>{neo.riskLevel} RISK</span>
            </div>

            <button
              className={`watch-btn ${isWatching ? 'watching' : ''}`}
              onClick={handleWatch}
              disabled={loading}
            >
              {isWatching ? '🔭 Observing' : '☆ Observe'}
            </button>
          </div>

          <div className="info-section">
            <h3>Physical Properties</h3>
            <div className="info-item">
              <span className="label">Diameter:</span>
              <span className="value">
                {neo.estimatedDiameter?.min && neo.estimatedDiameter?.max
                  ? `${Math.round(neo.estimatedDiameter.min)} - ${Math.round(neo.estimatedDiameter.max)}m`
                  : 'N/A'}
              </span>
            </div>
            <div className="info-item">
              <span className="label">Magnitude:</span>
              <span className="value">{neo.absoluteMagnitude || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="label">Potentially Hazardous:</span>
              <span className="value">
                {neo.isPotentiallyHazardous ? '⚠️ Yes' : '✓ No'}
              </span>
            </div>
          </div>

          {neo.closeApproachDates && neo.closeApproachDates.length > 0 && (
            <div className="info-section">
              <h3>Next Close Approaches</h3>
              {neo.closeApproachDates.slice(0, 3).map((approach, idx) => (
                <div key={idx} className="approach-item">
                  <div className="approach-date">
                    {new Date(approach.date).toLocaleDateString()}
                  </div>
                  <div className="approach-info">
                    <span>Distance: {approach.missDistance?.km?.toFixed(0)} km</span>
                    <span>Velocity: {approach.relativeVelocity?.kmPerHour?.toFixed(2)} km/h</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>

        <main className="details-main">
          <section className="analysis-section">
            <h2>Risk Analysis</h2>
            <div className="analysis-content">
              <div className="analysis-item">
                <h4>Risk Score: {neo.riskScore}/100</h4>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${neo.riskScore}%`,
                      background: neo.riskScore >= 75 ? '#ff6b6b' :
                                 neo.riskScore >= 50 ? '#ffc107' :
                                 neo.riskScore >= 25 ? '#ffb700' : '#00d4ff'
                    }}
                  />
                </div>
              </div>

              <div className="risk-factors">
                <h4>Risk Factors</h4>
                <ul>
                  <li>
                    <strong>Hazardous Status:</strong> {neo.isPotentiallyHazardous ? 
                      'This asteroid is classified as potentially hazardous' : 
                      'This asteroid is not considered hazardous'}
                  </li>
                  <li>
                    <strong>Size:</strong> {neo.estimatedDiameter?.max ? 
                      `Large object (${Math.round(neo.estimatedDiameter.max)}m diameter)` :
                      'Size data unavailable'}
                  </li>
                  <li>
                    <strong>Orbital Data:</strong> Contains detailed trajectory information for close approaches
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <section className="analysis-section">
            <h2>Trajectory & History</h2>
            {approaches.length === 0 ? (
              <div className="no-messages">No historical approach data available.</div>
            ) : (
              <div className="charts-grid">
                <ChartPanel
                  title="Miss Distance (km)"
                  series={missSeries}
                  dates={approaches}
                  color="#00c8ff"
                />
                <ChartPanel
                  title="Velocity (km/h)"
                  series={velocitySeries}
                  dates={approaches}
                  color="#ffbe46"
                />
              </div>
            )}
          </section>
        </main>
      </div>

      <section className="chat-section full-width-section">
        <h2>Community Discussion</h2>
        {!token && (
          <div className="login-notice">
            Log in to join the discussion.
            <button onClick={() => navigate('/login')}>Login</button>
          </div>
        )}
        <div className="chat-container">
          <div className="messages-list">
            {messages.length === 0 ? (
              <div className="no-messages">
                No messages yet. Be the first to discuss this asteroid!
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="message">
                  <strong>{msg.username}</strong>
                  <p>{msg.text}</p>
                  <span className="timestamp">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSendMessage} className="message-form">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Share your thoughts about this asteroid..."
              maxLength={500}
              disabled={!token}
            />
            <button type="submit" disabled={!token}>Send</button>
          </form>
        </div>
      </section>
    </div>
  );
}

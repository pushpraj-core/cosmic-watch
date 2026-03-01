import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../hooks/useAuth';
import '../styles/Community.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Community() {
  const navigate = useNavigate();
  const { user, token, logout } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [fetchError, setFetchError] = useState(null);

  // Protect the route
  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`${API_URL}/chat/COMMUNITY`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data);
      setFetchError(null);
    } catch (err) {
      console.error('Error fetching messages:', err);
      // Don't show error if it's just empty chat on first load, but here it's likely API error
      setFetchError('Failed to load community messages.');
    }
  };

  // Poll for messages every 5 seconds
  useEffect(() => {
    if (!token) return;

    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      setLoading(true);
      const response = await axios.post(
        `${API_URL}/chat`,
        {
          neoId: 'COMMUNITY',
          message: newMessage
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setMessages([...messages, response.data]);
      setNewMessage('');
      scrollToBottom();
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!token) {
    return null; // or a loading spinner while redirecting
  }

  return (
    <div className="community-container">
      <header className="community-header">
        <h1 onClick={() => navigate('/dashboard')}>🌌 Cosmic Watch Community</h1>
        <div className="header-right">
          <span className="user-info" style={{ marginRight: '1rem', color: '#fff' }}>
            {user?.username}
          </span>
          <button 
            onClick={() => navigate('/dashboard')} 
            style={{ 
              marginRight: '1rem', 
              padding: '0.5rem 1rem', 
              background: 'transparent', 
              color: '#58a6ff', 
              border: '1px solid #30363d',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Dashboard
          </button>
          <button 
            className="logout-btn" 
            onClick={handleLogout}
            style={{
              padding: '0.5rem 1rem',
              background: '#da3633',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </header>

      <div className="community-content">
        <div className="chat-container">
          <div className="chat-header">
            <h2>Global Watcher Chat</h2>
            <p style={{ color: '#8b949e', fontSize: '0.9rem', margin: '5px 0 0' }}>
              Discuss observations and asteroid data with fellow watchers.
            </p>
          </div>

          <div className="messages-area">
            {fetchError && <div className="error-message" style={{color: 'red', textAlign:'center'}}>{fetchError}</div>}
            
            {messages.length === 0 && !fetchError && (
              <div className="no-messages">
                No messages yet. Be the first to start the conversation!
              </div>
            )}

            {messages.map((msg) => (
              <div 
                key={msg._id || msg.id} 
                className={`message ${msg.username === user?.username ? 'own' : 'other'}`}
              >
                <div className="message-header">
                  <span className="username">{msg.username}</span>
                  <span className="timestamp">
                    {new Date(msg.timestamp || msg.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <div className="message-text">{msg.message}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form className="input-area" onSubmit={handleSendMessage}>
            <input
              type="text"
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={loading}
            />
            <button type="submit" className="send-btn" disabled={loading || !newMessage.trim()}>
              {loading ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

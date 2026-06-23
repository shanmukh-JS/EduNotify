import React, { useState } from 'react';
import { GraduationCap, Lock, User, AlertCircle } from 'lucide-react';
import { api } from '../utils/api.js';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please provide both username and password.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const data = await api.post('/auth/login', { username, password }, true);
      api.setToken(data.token);
      api.setUser(data.user);
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)',
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '420px',
        width: '100%',
        padding: '40px 32px',
        background: 'rgba(255, 255, 255, 0.08)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        boxShadow: '0 20px 40px 0 rgba(0, 0, 0, 0.3)'
      }}>
        {/* Branding header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px', gap: '8px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '16px',
            background: 'var(--primary-accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 16px 0 rgba(99, 102, 241, 0.3)'
          }}>
            <GraduationCap size={36} color="#ffffff" />
          </div>
          <h2 style={{ color: '#ffffff', fontSize: '28px', fontWeight: '800', marginTop: '12px' }}>EduNotify</h2>
          <p style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center' }}>
            Intelligent School Communication Suite
          </p>
        </div>

        {error && (
          <div className="flex-center" style={{
            background: 'rgba(244, 63, 94, 0.1)',
            border: '1px solid rgba(244, 63, 94, 0.2)',
            padding: '12px',
            borderRadius: 'var(--border-radius-sm)',
            color: '#fda4af',
            fontSize: '13px',
            gap: '8px',
            marginBottom: '20px'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="form-group">
            <label className="form-label" style={{ color: '#cbd5e1' }}>Username</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '14px', top: '12px', color: '#64748b' }} />
              <input 
                type="text" 
                className="form-input" 
                style={{ paddingLeft: '44px', background: 'rgba(15, 23, 42, 0.5)', borderColor: 'rgba(255, 255, 255, 0.1)', color: '#ffffff' }}
                placeholder="Enter user username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ color: '#cbd5e1' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '14px', top: '12px', color: '#64748b' }} />
              <input 
                type="password" 
                className="form-input" 
                style={{ paddingLeft: '44px', background: 'rgba(15, 23, 42, 0.5)', borderColor: 'rgba(255, 255, 255, 0.1)', color: '#ffffff' }}
                placeholder="Enter user password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ 
              marginTop: '10px', 
              padding: '12px', 
              fontSize: '15px', 
              boxShadow: '0 4px 12px 0 rgba(99, 102, 241, 0.3)'
            }}
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '12px', color: '#64748b' }}>
          <span>Demo Credentials: <b>admin</b> / <b>admin123</b></span>
        </div>
      </div>
    </div>
  );
}

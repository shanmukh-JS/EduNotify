import React, { useState, useEffect } from 'react';
import { Radio, AlertTriangle, Send, RefreshCw } from 'lucide-react';
import { api } from '../utils/api.js';

export default function Broadcast({ user }) {
  const [subject, setSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [channels, setChannels] = useState(['SMS', 'EMAIL']);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState('');
  const [pastBroadcasts, setPastBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBroadcasts = async () => {
    setLoading(true);
    try {
      const data = await api.get('/broadcasts');
      setPastBroadcasts(data);
    } catch (err) {
      console.error('Fetch broadcasts error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBroadcasts();
  }, []);

  const handleChannelToggle = (ch) => {
    setChannels(prev => 
      prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]
    );
  };

  const handleBroadcastSubmit = async (e) => {
    e.preventDefault();
    if (!subject || !messageBody) {
      alert('Please fill out the announcement subject and body text.');
      return;
    }
    if (channels.length === 0) {
      alert('Please select at least one delivery channel.');
      return;
    }

    if (!window.confirm(`Are you sure you want to broadcast this message to ALL registered parents via [${channels.join(', ')}]? This action cannot be undone.`)) {
      return;
    }

    setSending(true);
    setSuccess('');

    try {
      const res = await api.post('/broadcasts', {
        subject,
        messageBody,
        channels
      });
      setSuccess(res.message || 'Emergency broadcast queued successfully.');
      setSubject('');
      setMessageBody('');
      fetchBroadcasts();
    } catch (err) {
      alert(`Broadcast failed: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Broadcast Form */}
      <div className="glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <Radio size={24} style={{ color: 'var(--danger-color)' }} />
          <div>
            <h3 style={{ fontSize: '18px' }}>Launch Emergency Parent Announcement</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Send urgent notification alerts globally to all student guardians</p>
          </div>
        </div>

        {success && (
          <div className="flex-center status-pill present" style={{ padding: '12px 24px', width: '100%', justifyContent: 'flex-start', borderRadius: 'var(--border-radius-sm)', gap: '8px', marginBottom: '20px' }}>
            <AlertTriangle size={18} color="var(--success-color)" />
            <span><b>{success}</b></span>
          </div>
        )}

        <form onSubmit={handleBroadcastSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="form-group">
            <label className="form-label">Broadcast Subject / Title</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. URGENT NOTICE: School Holiday Declared due to Heavy Rainfall"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={sending}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Message Body Context</label>
            <textarea 
              className="form-textarea" 
              rows="4"
              placeholder="Enter message details. Use placeholders: {{parent_name}}, {{student_name}}, {{class}} to personalize."
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              disabled={sending}
              required
            />
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Supported variables: <code>{"{{parent_name}}"}</code>, <code>{"{{student_name}}"}</code>, <code>{"{{class}}"}</code>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Dispatch Channels Selector</label>
            <div style={{ display: 'flex', gap: '20px' }}>
              {['SMS', 'EMAIL', 'WHATSAPP', 'CALL'].map((ch) => (
                <label key={ch} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer', fontWeight: '500' }}>
                  <input 
                    type="checkbox" 
                    checked={channels.includes(ch)}
                    onChange={() => handleChannelToggle(ch)}
                    disabled={sending}
                  />
                  <span>{ch}</span>
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button type="submit" className="btn btn-danger" style={{ gap: '10px' }} disabled={sending}>
              <Send size={16} />
              <span>{sending ? 'Dispatching Broadcast...' : 'Launch Global Announcement'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Broadcast History list */}
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '16px' }}>Past Global Announcements Log</h3>
          <button className="btn btn-secondary" style={{ padding: '6px 12px' }} onClick={fetchBroadcasts}>
            <RefreshCw size={14} />
          </button>
        </div>

        <div className="table-responsive" style={{ border: 'none', borderRadius: '0' }}>
          {loading ? (
            <div className="loading-container" style={{ padding: '40px' }}>
              <div className="spinner"></div>
            </div>
          ) : pastBroadcasts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              No past broadcasts found.
            </div>
          ) : (
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Sender</th>
                  <th>Subject</th>
                  <th>Channels Dispatched</th>
                  <th>State</th>
                </tr>
              </thead>
              <tbody>
                {pastBroadcasts.map((br) => {
                  const dateStr = new Date(br.created_at).toLocaleString();
                  return (
                    <tr key={br.id}>
                      <td>{dateStr}</td>
                      <td>{br.sender_name}</td>
                      <td><b>{br.subject}</b></td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {br.channels.map((c) => (
                            <span key={c} style={{ fontSize: '10px', background: 'var(--primary-light)', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>
                              {c}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span className={`status-pill ${br.status === 'SENT' ? 'present' : 'processing'}`}>
                          {br.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

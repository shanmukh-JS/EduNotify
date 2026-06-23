import React, { useState, useEffect } from 'react';
import { Calendar, Search, ExternalLink, RefreshCcw, Send, AlertTriangle } from 'lucide-react';
import { api } from '../utils/api.js';

export default function Absentees() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [absentees, setAbsentees] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAbsentees = async () => {
    setLoading(true);
    try {
      const data = await api.get(`/logs/absentees-telemetry?date=${date}`);
      setAbsentees(data);
    } catch (err) {
      console.error('Fetch absentees error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAbsentees();
  }, [date]);

  // Open simulated parent feedback portal
  const handleSimulateClick = (notificationId) => {
    if (!notificationId) {
      alert('Notification instance not found. Make sure attendance has been finalized to generate notifications.');
      return;
    }
    const url = `${window.location.origin}/acknowledge/${notificationId}`;
    window.open(url, '_blank');
  };

  return (
    <>
      {/* Date filter bar */}
      <div className="filter-bar">
        <div className="filter-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} style={{ color: '#64748b' }} />
            <input 
              type="date" 
              className="form-input" 
              style={{ width: '160px' }}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        <div className="filter-group">
          <button className="btn btn-secondary" onClick={fetchAbsentees}>
            <RefreshCcw size={16} />
            <span>Reload Logs</span>
          </button>
        </div>
      </div>

      {/* Main absent queue table */}
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading absentee dispatch status logs...</p>
          </div>
        ) : absentees.length === 0 ? (
          <div className="empty-state">
            <Send size={48} />
            <h3>No Absentees Registered</h3>
            <p>No students have been marked absent for {date}, or attendance registers have not been finalized yet.</p>
          </div>
        ) : (
          <div className="table-responsive" style={{ border: 'none', borderRadius: '0' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Roll</th>
                  <th>Student Name</th>
                  <th>Class / Section</th>
                  <th>Parent / Guardian</th>
                  <th>Contact Number</th>
                  <th>Channel</th>
                  <th>Alert Delivery</th>
                  <th>Parent Status</th>
                  <th style={{ textAlign: 'center' }}>Test Actions</th>
                </tr>
              </thead>
              <tbody>
                {absentees.map((item, idx) => (
                  <tr key={idx}>
                    <td><b>#{item.roll_number}</b></td>
                    <td>{item.first_name} {item.last_name}</td>
                    <td>{item.grade_class} - {item.section}</td>
                    <td>{item.parent_name}</td>
                    <td>{item.parent_phone}</td>
                    <td>
                      <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>
                        {item.channel || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill ${(item.notification_status || 'pending').toLowerCase()}`}>
                        {item.notification_status || 'Unsent'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill ${(item.acknowledgement_status || 'pending').toLowerCase()}`}>
                        {item.acknowledgement_status || 'Unacknowledged'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {item.notification_id ? (
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '6px 12px', fontSize: '12px', gap: '6px' }}
                          onClick={() => handleSimulateClick(item.notification_id)}
                        >
                          <ExternalLink size={12} />
                          <span>Simulate Parent Link</span>
                        </button>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Roster unfinalized</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

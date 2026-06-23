import React, { useState, useEffect } from 'react';
import { Phone, RefreshCw, AlertTriangle } from 'lucide-react';
import { api } from '../utils/api.js';

export default function CallLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.get('/logs/call-logs');
      setLogs(data);
    } catch (err) {
      console.error('Fetch call logs error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <>
      {/* Control bar */}
      <div className="filter-bar">
        <div>
          <h3 style={{ fontSize: '15px' }}>Provider Connection: Active</h3>
        </div>
        <button className="btn btn-secondary" onClick={fetchLogs}>
          <RefreshCw size={16} />
          <span>Reload logs</span>
        </button>
      </div>

      {/* Roster Listing Grid */}
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading voice dialer telemetry records...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <Phone size={48} />
            <h3>No Call Logs Recorded</h3>
            <p>No voice calling alerts have been dispatched yet.</p>
          </div>
        ) : (
          <div className="table-responsive" style={{ border: 'none', borderRadius: '0' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Student Name</th>
                  <th>Parent / Guardian</th>
                  <th>Dialed Number</th>
                  <th>Call Status</th>
                  <th>Duration</th>
                  <th>Gateways Provider</th>
                  <th>Remarks / Outcome</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const dateStr = new Date(log.timestamp).toLocaleString();
                  return (
                    <tr key={log.id}>
                      <td>{dateStr}</td>
                      <td>{log.student_first_name} {log.student_last_name}</td>
                      <td>{log.parent_name}</td>
                      <td>{log.parent_number}</td>
                      <td>
                        <span className={`status-pill ${log.status === 'COMPLETED' ? 'present' : log.status === 'BUSY' ? 'cancelled' : 'failed'}`}>
                          {log.status}
                        </span>
                      </td>
                      <td>
                        <b>{log.duration_seconds || 0}s</b>
                      </td>
                      <td>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>{log.provider_name}</span>
                      </td>
                      <td style={{ fontSize: '13px' }}>{log.remarks}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

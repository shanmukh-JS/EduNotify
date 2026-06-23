import React, { useState, useEffect } from 'react';
import { Shield, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { api } from '../utils/api.js';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedLogId, setExpandedLogId] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.get('/logs/audit-logs');
      setLogs(data);
    } catch (err) {
      console.error('Fetch audit logs error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const toggleExpand = (logId) => {
    setExpandedLogId(prev => prev === logId ? null : logId);
  };

  return (
    <>
      <div className="filter-bar">
        <div>
          <h3 style={{ fontSize: '15px' }}>Immutable Administrative Audit Records</h3>
        </div>
        <button className="btn btn-secondary" onClick={fetchLogs}>
          <RefreshCw size={16} />
          <span>Reload logs</span>
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading security audit logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <Shield size={48} />
            <h3>No Audit Trails Recorded</h3>
            <p>No actions have mutated database records yet.</p>
          </div>
        ) : (
          <div className="table-responsive" style={{ border: 'none', borderRadius: '0' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}></th>
                  <th>Timestamp</th>
                  <th>Actor User</th>
                  <th>Actor Role</th>
                  <th>Action</th>
                  <th>Affected Module</th>
                  <th>Target Record Key</th>
                  <th style={{ textAlign: 'center' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const dateStr = new Date(log.timestamp).toLocaleString();
                  const isExpanded = expandedLogId === log.id;
                  return (
                    <React.Fragment key={log.id}>
                      <tr>
                        <td>
                          <Shield size={16} style={{ color: log.action.includes('DELETE') ? 'var(--danger-color)' : log.action.includes('CREATE') ? 'var(--success-color)' : 'var(--primary-accent)' }} />
                        </td>
                        <td>{dateStr}</td>
                        <td><b>{log.user_name || 'System Worker'}</b></td>
                        <td>
                          <span className={`role-badge ${(log.user_role || 'system').toLowerCase()}`} style={{ fontSize: '10px' }}>
                            {log.user_role || 'SYSTEM'}
                          </span>
                        </td>
                        <td>
                          <code style={{ fontSize: '12px', fontWeight: 'bold' }}>{log.action}</code>
                        </td>
                        <td>{log.table_name}</td>
                        <td><small>{log.record_id}</small></td>
                        <td style={{ textAlign: 'center' }}>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                            onClick={() => toggleExpand(log.id)}
                          >
                            {isExpanded ? <EyeOff size={12} /> : <Eye size={12} />}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan="8" style={{ background: '#f8fafc', padding: '24px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                              <div>
                                <h5 style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Old Values</h5>
                                <pre style={{ 
                                  background: '#0f172a', 
                                  color: '#38bdf8', 
                                  padding: '12px', 
                                  borderRadius: '6px', 
                                  fontSize: '11px', 
                                  overflowX: 'auto',
                                  maxHeight: '200px'
                                }}>
                                  {log.old_values ? JSON.stringify(log.old_values, null, 2) : '// No original records'}
                                </pre>
                              </div>
                              <div>
                                <h5 style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>New Values</h5>
                                <pre style={{ 
                                  background: '#0f172a', 
                                  color: '#34d399', 
                                  padding: '12px', 
                                  borderRadius: '6px', 
                                  fontSize: '11px', 
                                  overflowX: 'auto',
                                  maxHeight: '200px'
                                }}>
                                  {log.new_values ? JSON.stringify(log.new_values, null, 2) : '// No mutations recorded'}
                                </pre>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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

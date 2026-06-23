import React, { useEffect, useState } from 'react';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Send, 
  MessageSquare, 
  AlertTriangle,
  Play,
  RotateCw,
  Clock,
  ThumbsUp
} from 'lucide-react';
import { api } from '../utils/api.js';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [triggering, setTriggering] = useState(false);

  const fetchStats = async () => {
    try {
      const data = await api.get('/dashboard/stats');
      setStats(data);
    } catch (err) {
      setError(err.message || 'Failed to aggregate dashboard analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleManualTrigger = async () => {
    setTriggering(true);
    try {
      await api.post('/scheduler/trigger', {});
      // Reload stats after small timeout for queue logs insertion
      setTimeout(() => {
        fetchStats();
        setTriggering(false);
      }, 1500);
    } catch (err) {
      alert(`Trigger failed: ${err.message}`);
      setTriggering(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading school telemetry dashboard analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <AlertTriangle size={48} color="var(--danger-color)" />
        <h3>Data Retrieval Error</h3>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={fetchStats}>
          <RotateCw size={16} />
          <span>Retry Loading</span>
        </button>
      </div>
    );
  }

  const { 
    attendanceSummary, 
    notificationSummary, 
    acknowledgementSummary, 
    todaysAbsentees = [],
    historicalTrends = [], 
    topAbsentClasses = []
  } = stats;

  // Custom SVG Line Chart Drawing parameters
  const renderTrendChart = () => {
    if (historicalTrends.length === 0) return <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No historical logs available.</p>;

    const svgWidth = 600;
    const svgHeight = 220;
    const paddingX = 40;
    const paddingY = 30;
    const chartWidth = svgWidth - paddingX * 2;
    const chartHeight = svgHeight - paddingY * 2;

    // Map stats points
    const points = historicalTrends.map((d, index) => {
      const x = paddingX + (index * (chartWidth / (historicalTrends.length - 1 || 1)));
      const rate = d.total > 0 ? ((d.present + d.late) / d.total) * 100 : 100;
      // Invert Y axis for SVG (0,0 is top-left)
      const y = paddingY + chartHeight - ((rate - 70) / 30) * chartHeight; // Scale rate between 70% and 100%
      return { x, y, rate, date: d.date };
    });

    const pathD = points.reduce((acc, p, index) => {
      return index === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');

    return (
      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} width="100%" height="100%">
        {/* Y Axis Grid lines (70%, 80%, 90%, 100%) */}
        {[70, 80, 90, 100].map((level, i) => {
          const y = paddingY + chartHeight - ((level - 70) / 30) * chartHeight;
          return (
            <g key={level}>
              <line x1={paddingX} y1={y} x2={svgWidth - paddingX} y2={y} stroke="#e2e8f0" strokeDasharray="4,4" />
              <text x={paddingX - 10} y={y + 4} textAnchor="end" fontSize="10" fill="#64748b">{level}%</text>
            </g>
          );
        })}

        {/* X Axis Labels */}
        {points.map((p, i) => {
          // Format date string from YYYY-MM-DD to DD/MM
          const parts = p.date.split('-');
          const label = parts.length > 2 ? `${parts[2]}/${parts[1]}` : p.date;
          return (
            <text key={i} x={p.x} y={svgHeight - 10} textAnchor="middle" fontSize="10" fill="#64748b">{label}</text>
          );
        })}

        {/* The Plot Curve */}
        <path d={pathD} fill="none" stroke="var(--primary-accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

        {/* The data points circles */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="5" fill="#ffffff" stroke="var(--primary-accent)" strokeWidth="3" />
            <title>{`Date: ${p.date}\nAttendance: ${Math.round(p.rate)}%`}</title>
          </g>
        ))}
      </svg>
    );
  };

  return (
    <>
      {/* Top Header trigger */}
      <div className="filter-bar" style={{ padding: '12px 24px' }}>
        <div>
          <h3 style={{ fontSize: '16px', color: 'var(--text-main)' }}>Platform Control Panel</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Trigger automated daily communications run manually</p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={handleManualTrigger}
          disabled={triggering}
          style={{ gap: '10px' }}
        >
          {triggering ? <RotateCw className="spinner" size={16} /> : <Play size={16} />}
          <span>{triggering ? 'Processing Scheduler Pipeline...' : 'Run Daily 12:00 PM Scheduler'}</span>
        </button>
      </div>

      {/* Main Roster Telemetry */}
      <div className="grid-cols-4">
        {/* Total Students Card */}
        <div className="stat-card">
          <div className="stat-details">
            <h3>Registered Students</h3>
            <span className="stat-number">{attendanceSummary.totalStudents}</span>
          </div>
          <div className="stat-icon-box primary">
            <Users size={24} />
          </div>
        </div>

        {/* Attendance Rate Card */}
        <div className="stat-card">
          <div className="stat-details">
            <h3>Daily Attendance Rate</h3>
            <span className="stat-number">{attendanceSummary.attendancePercentage}%</span>
          </div>
          <div className="stat-icon-box success">
            <CheckCircle size={24} />
          </div>
        </div>

        {/* Absentees Card */}
        <div className="stat-card">
          <div className="stat-details">
            <h3>Today's Absentees</h3>
            <span className="stat-number">{attendanceSummary.absentToday}</span>
          </div>
          <div className="stat-icon-box danger">
            <XCircle size={24} />
          </div>
        </div>

        {/* Queued Notifications Card */}
        <div className="stat-card">
          <div className="stat-details">
            <h3>Success Dispatch Rate</h3>
            <span className="stat-number">
              {notificationSummary.total > 0 
                ? Math.round((notificationSummary.success / notificationSummary.total) * 100) 
                : 100}%
            </span>
          </div>
          <div className="stat-icon-box warning">
            <Send size={24} />
          </div>
        </div>
      </div>

      {/* Ratios and Graphs Sections */}
      <div className="grid-cols-3">
        {/* Communications Channel Mix */}
        <div className="chart-container">
          <div className="chart-header">
            <h3>Channels Dispatch Breakdown</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '10px 0' }}>
            {Object.entries(notificationSummary.channels).map(([channel, count]) => {
              const total = notificationSummary.total || 1;
              const percent = Math.round((count / total) * 100);
              return (
                <div key={channel} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '500' }}>
                    <span>{channel} Alert</span>
                    <span style={{ color: 'var(--text-muted)' }}>{count} items ({percent}%)</span>
                  </div>
                  <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ 
                      height: '100%', 
                      width: `${percent}%`, 
                      background: channel === 'CALL' ? '#6366f1' : channel === 'SMS' ? '#10b981' : channel === 'WHATSAPP' ? '#f59e0b' : '#3b82f6',
                      borderRadius: '4px' 
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Parent Acknowledgements Telemetry */}
        <div className="chart-container">
          <div className="chart-header">
            <h3>Parent Responses Rates</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', justifyContent: 'center', height: '100%' }}>
            <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-around', textAlign: 'center' }}>
              <div>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                  <ThumbsUp size={24} />
                </div>
                <h4 style={{ fontSize: '20px', color: '#10b981' }}>{acknowledgementSummary.acknowledged}</h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Acknowledged</p>
              </div>

              <div>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#fff1f2', color: '#f43f5e', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                  <Clock size={24} />
                </div>
                <h4 style={{ fontSize: '20px', color: '#f43f5e' }}>{acknowledgementSummary.needsFollowUp}</h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Needs Follow-up</p>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Average Response Time:</span>
                <strong style={{ color: 'var(--text-main)' }}>
                  {acknowledgementSummary.avgResponseTimeSeconds > 0 
                    ? `${Math.round(acknowledgementSummary.avgResponseTimeSeconds / 60)} min`
                    : 'N/A'}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Unresolved Follow-ups:</span>
                <strong style={{ color: 'var(--text-main)' }}>{acknowledgementSummary.needsFollowUp} parent alerts</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Top Class Absences Ranking */}
        <div className="chart-container">
          <div className="chart-header">
            <h3>Top Absent Classes</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', justifyContent: 'center', height: '100%' }}>
            {topAbsentClasses.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>No absences logged this month.</p>
            ) : (
              topAbsentClasses.map((cls, idx) => {
                const maxVal = topAbsentClasses[0]?.absences || 1;
                const widthPercent = Math.round((cls.absences / maxVal) * 100);
                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '80px', fontSize: '13px', fontWeight: '600' }}>{cls.class}</div>
                    <div style={{ flexGrow: 1, height: '16px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ 
                        height: '100%', 
                        width: `${widthPercent}%`, 
                        background: 'linear-gradient(90deg, #3b82f6 0%, #6366f1 100%)',
                        borderRadius: '4px'
                      }} />
                    </div>
                    <div style={{ width: '30px', fontSize: '12px', fontWeight: '700', textAlign: 'right' }}>{cls.absences}</div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Historical Trend Curve */}
      <div className="chart-container" style={{ minHeight: '280px' }}>
        <div className="chart-header">
          <h3>Daily Attendance Rate Curve (7-Day Trend)</h3>
          <span style={{ fontSize: '12px', background: 'var(--primary-light)', padding: '4px 8px', borderRadius: '4px', color: 'var(--primary-color)', fontWeight: '600' }}>
            Scale: 70% - 100%
          </span>
        </div>
        <div style={{ height: '220px' }}>
          {renderTrendChart()}
        </div>
      </div>

      {/* Today's Absentees Preview Table */}
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '16px' }}>Today's Absentee Dispatch Status</h3>
          <span className="status-pill present" style={{ fontSize: '11px' }}>
            {attendanceSummary.absentToday} Absentees Marked Today
          </span>
        </div>

        <div className="table-responsive" style={{ border: 'none', borderRadius: '0' }}>
          {todaysAbsentees.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              No absent students marked today. Roster attendance might not be finalized yet.
            </div>
          ) : (
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Roll</th>
                  <th>Student Name</th>
                  <th>Class</th>
                  <th>Section</th>
                  <th>Parent</th>
                  <th>Channel</th>
                  <th>Dispatch State</th>
                  <th>Acknowledgement</th>
                </tr>
              </thead>
              <tbody>
                {todaysAbsentees.map((item, idx) => (
                  <tr key={idx}>
                    <td><b>#{item.roll_number}</b></td>
                    <td>{item.first_name} {item.last_name}</td>
                    <td>{item.grade_class}</td>
                    <td>{item.section}</td>
                    <td>{item.parent_name}</td>
                    <td><span style={{ textTransform: 'uppercase', fontSize: '12px', fontWeight: '600' }}>{item.channel || 'N/A'}</span></td>
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
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}

import React, { useState, useEffect } from 'react';
import { Calendar, Search, Save, CheckSquare, ShieldCheck, AlertCircle, Info } from 'lucide-react';
import { api } from '../utils/api.js';

export default function Attendance({ user }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [gradeClass, setGradeClass] = useState('Grade 10');
  const [section, setSection] = useState('Section A');
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchRoster = async () => {
    setLoading(true);
    setSuccessMsg('');
    try {
      const data = await api.get(`/attendance/roster?date=${date}&gradeClass=${gradeClass}&section=${section}`);
      // If student status is null, default them to 'PRESENT'
      const initialized = data.map(item => ({
        ...item,
        status: item.status || 'PRESENT',
        remarks: item.remarks || ''
      }));
      setRoster(initialized);

      // Check if roster is finalized
      const finalized = data.length > 0 && data.every(item => item.finalized === 1 || item.finalized === true);
      setIsFinalized(finalized);
    } catch (err) {
      alert(`Failed to fetch roster: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoster();
  }, [date, gradeClass, section]);

  const handleStatusChange = (studentId, status) => {
    if (isFinalized) return;
    setRoster(prev => prev.map(item => 
      item.student_id === studentId ? { ...item, status } : item
    ));
  };

  const handleRemarksChange = (studentId, remarks) => {
    if (isFinalized) return;
    setRoster(prev => prev.map(item => 
      item.student_id === studentId ? { ...item, remarks } : item
    ));
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    setSuccessMsg('');
    try {
      const records = roster.map(r => ({
        studentId: r.student_id,
        date,
        status: r.status,
        remarks: r.remarks
      }));

      await api.post('/attendance/mark', { records });
      setSuccessMsg('Attendance draft saved successfully.');
      fetchRoster();
    } catch (err) {
      alert(`Failed to save draft: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleFinalize = async () => {
    if (!window.confirm('WARNING: Finalizing attendance will lock the records and automatically queue notification alerts (Calls, SMS, WhatsApp, Email) to the parents of all absent students. Do you wish to proceed?')) {
      return;
    }

    setSaving(true);
    setSuccessMsg('');
    try {
      // First save current states as draft to ensure DB has updated values
      const records = roster.map(r => ({
        studentId: r.student_id,
        date,
        status: r.status,
        remarks: r.remarks
      }));
      await api.post('/attendance/mark', { records });

      // Then trigger finalization pipeline
      const res = await api.post('/attendance/finalize', { date, gradeClass, section });
      setSuccessMsg(res.message || 'Attendance finalized. Parent alerts queued!');
      fetchRoster();
    } catch (err) {
      alert(`Failed to finalize: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const canMark = ['SUPER_ADMIN', 'PRINCIPAL', 'COORDINATOR', 'TEACHER'].includes(user?.role);

  return (
    <>
      {/* Parameters Filter Header */}
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

          <select className="form-select" style={{ width: '150px' }} value={gradeClass} onChange={(e) => setGradeClass(e.target.value)}>
            <option value="Grade 10">Grade 10</option>
            <option value="Grade 9">Grade 9</option>
            <option value="Grade 8">Grade 8</option>
          </select>

          <select className="form-select" style={{ width: '130px' }} value={section} onChange={(e) => setSection(e.target.value)}>
            <option value="Section A">Section A</option>
            <option value="Section B">Section B</option>
            <option value="Section C">Section C</option>
          </select>
        </div>

        <div className="filter-group">
          {isFinalized ? (
            <div className="flex-center status-pill present" style={{ gap: '8px', padding: '8px 16px', borderRadius: 'var(--border-radius-sm)', border: '1px solid #a7f3d0' }}>
              <ShieldCheck size={18} />
              <span>Register Finalized & Closed</span>
            </div>
          ) : (
            canMark && roster.length > 0 && (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-secondary" onClick={handleSaveDraft} disabled={saving}>
                  <Save size={16} />
                  <span>Save Draft</span>
                </button>
                <button className="btn btn-success" onClick={handleFinalize} disabled={saving}>
                  <CheckSquare size={16} />
                  <span>Finalize & Notify Parents</span>
                </button>
              </div>
            )
          )}
        </div>
      </div>

      {successMsg && (
        <div className="flex-center status-pill present" style={{ padding: '12px 24px', width: '100%', justifyContent: 'flex-start', borderRadius: 'var(--border-radius-md)', gap: '8px' }}>
          <Info size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Roster Marking Grid */}
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading class roster data...</p>
          </div>
        ) : roster.length === 0 ? (
          <div className="empty-state">
            <AlertCircle size={48} />
            <h3>No Roster Found</h3>
            <p>There are no active student profiles registered under {gradeClass} {section}.</p>
          </div>
        ) : (
          <div className="table-responsive" style={{ border: 'none', borderRadius: '0' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>Roll</th>
                  <th style={{ width: '150px' }}>Admission No.</th>
                  <th>Student Name</th>
                  <th style={{ width: '380px' }}>Attendance Status</th>
                  <th>Status Remarks</th>
                </tr>
              </thead>
              <tbody>
                {roster.map((student) => (
                  <tr key={student.student_id}>
                    <td><b>#{student.roll_number}</b></td>
                    <td>{student.admission_number}</td>
                    <td>{student.first_name} {student.last_name}</td>
                    <td>
                      <div className="attendance-card-options">
                        <button 
                          className={`attendance-opt-btn present ${student.status === 'PRESENT' ? 'active' : ''}`}
                          onClick={() => handleStatusChange(student.student_id, 'PRESENT')}
                          disabled={isFinalized || !canMark}
                        >
                          PRESENT
                        </button>
                        <button 
                          className={`attendance-opt-btn absent ${student.status === 'ABSENT' ? 'active' : ''}`}
                          onClick={() => handleStatusChange(student.student_id, 'ABSENT')}
                          disabled={isFinalized || !canMark}
                        >
                          ABSENT
                        </button>
                        <button 
                          className={`attendance-opt-btn late ${student.status === 'LATE' ? 'active' : ''}`}
                          onClick={() => handleStatusChange(student.student_id, 'LATE')}
                          disabled={isFinalized || !canMark}
                        >
                          LATE
                        </button>
                        <button 
                          className={`attendance-opt-btn excused ${student.status === 'EXCUSED' ? 'active' : ''}`}
                          onClick={() => handleStatusChange(student.student_id, 'EXCUSED')}
                          disabled={isFinalized || !canMark}
                        >
                          EXCUSED
                        </button>
                      </div>
                    </td>
                    <td>
                      <input 
                        type="text" 
                        className="form-input" 
                        style={{ padding: '6px 10px', fontSize: '13px' }}
                        placeholder="Add optional notes..."
                        value={student.remarks}
                        onChange={(e) => handleRemarksChange(student.student_id, e.target.value)}
                        disabled={isFinalized || !canMark}
                      />
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

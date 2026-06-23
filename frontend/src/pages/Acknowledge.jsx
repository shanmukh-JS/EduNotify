import React, { useState, useEffect } from 'react';
import { ShieldCheck, Calendar, User, BookOpen, Clock, ThumbsUp, HelpCircle } from 'lucide-react';
import { api } from '../utils/api.js';

export default function Acknowledge({ notificationId }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState('ACKNOWLEDGED'); // ACKNOWLEDGED, NEEDS_FOLLOW_UP
  const [remarks, setRemarks] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const fetchDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get(`/public/acknowledgements/${notificationId}`, true);
      setDetails(data);
      if (data.acknowledged_at) {
        setSubmitted(true);
        setStatus(data.status);
        setRemarks(data.remarks || '');
      }
    } catch (err) {
      setError(err.message || 'The acknowledgement link is invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (notificationId) {
      fetchDetails();
    }
  }, [notificationId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await api.post(`/public/acknowledgements/${notificationId}`, {
        status,
        remarks
      }, true);
      setSubmitted(true);
      fetchDetails();
    } catch (err) {
      setError(err.message || 'Failed to submit response.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="public-ack-layout">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="public-ack-layout">
        <div className="public-ack-card">
          <div className="public-ack-header" style={{ background: 'var(--danger-color)' }}>
            <HelpCircle size={48} style={{ margin: '0 auto 12px', opacity: 0.9 }} />
            <h2 style={{ color: '#ffffff' }}>Verification Code Invalid</h2>
            <p style={{ opacity: 0.8, fontSize: '13px', marginTop: '6px' }}>The acknowledgement link is incorrect or expired</p>
          </div>
          <div className="public-ack-body" style={{ textAlign: 'center', padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{error}</p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Please verify the link sent via SMS, WhatsApp, or Email, or contact the school office.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="public-ack-layout">
      <div className="public-ack-card">
        {/* Header decoration */}
        <div className="public-ack-header">
          <ShieldCheck size={48} style={{ margin: '0 auto 12px', opacity: 0.9 }} />
          <h2>School Attendance Portal</h2>
          <p style={{ opacity: 0.8, fontSize: '13px', marginTop: '6px' }}>Official Parent Response Verification System</p>
        </div>

        {submitted ? (
          /* Confirmation Success Screen */
          <div className="public-ack-body" style={{ textAlign: 'center', alignItems: 'center' }}>
            <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: '#d1fae5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
              <ThumbsUp size={32} />
            </div>
            <h3 style={{ fontSize: '20px', color: '#10b981' }}>Response Recorded</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
              Thank you. Springdale High School administration has been notified of your response.
            </p>

            <div className="public-ack-info" style={{ width: '100%', marginTop: '16px' }}>
              <div className="public-ack-info-row">
                <span className="public-ack-info-label">Student:</span>
                <span className="public-ack-info-value">{details?.first_name || ''} {details?.last_name || ''}</span>
              </div>
              <div className="public-ack-info-row">
                <span className="public-ack-info-label">Action:</span>
                <span className="public-ack-info-value" style={{ color: status === 'ACKNOWLEDGED' ? '#10b981' : '#f43f5e' }}>
                  {status === 'ACKNOWLEDGED' ? 'Absence Confirmed' : 'Follow-up Requested'}
                </span>
              </div>
              {remarks && (
                <div style={{ textAlign: 'left', borderTop: '1px solid var(--border-color)', paddingTop: '10px', marginTop: '10px', fontSize: '13px' }}>
                  <span className="public-ack-info-label" style={{ display: 'block', marginBottom: '4px' }}>Remarks:</span>
                  <span style={{ fontStyle: 'italic' }}>"{remarks}"</span>
                </div>
              )}
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '24px' }}>
              You may now close this window.
            </p>
          </div>
        ) : (
          /* Response Form */
          <div className="public-ack-body">
            {error && (
              <div className="flex-center status-pill failed" style={{ padding: '12px', borderRadius: 'var(--border-radius-sm)', gap: '8px', marginBottom: '10px' }}>
                <span>{error}</span>
              </div>
            )}

            <p style={{ fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center' }}>
              Dear parent/guardian, please confirm the attendance status for your child below:
            </p>

            <div className="public-ack-info">
              <div className="public-ack-info-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <User size={16} style={{ color: '#64748b' }} />
                  <span className="public-ack-info-label">Student Name:</span>
                </div>
                <span className="public-ack-info-value">{details?.first_name || ''} {details?.last_name || ''}</span>
              </div>
              <div className="public-ack-info-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BookOpen size={16} style={{ color: '#64748b' }} />
                  <span className="public-ack-info-label">Grade Class:</span>
                </div>
                <span className="public-ack-info-value">Grade 10 - Section A</span>
              </div>
              <div className="public-ack-info-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={16} style={{ color: '#64748b' }} />
                  <span className="public-ack-info-label">Absence Date:</span>
                </div>
                <span className="public-ack-info-value">{details.date || new Date().toISOString().split('T')[0]}</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: '600' }}>Choose Response Status *</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '6px' }}>
                  <label style={{ 
                    display: 'flex', 
                    padding: '12px 16px', 
                    border: '1px solid', 
                    borderColor: status === 'ACKNOWLEDGED' ? 'var(--success-color)' : 'var(--border-color)',
                    background: status === 'ACKNOWLEDGED' ? 'var(--success-light)' : '#ffffff',
                    borderRadius: '8px', 
                    cursor: 'pointer', 
                    alignItems: 'flex-start',
                    gap: '12px'
                  }}>
                    <input 
                      type="radio" 
                      name="status" 
                      value="ACKNOWLEDGED" 
                      checked={status === 'ACKNOWLEDGED'}
                      onChange={() => setStatus('ACKNOWLEDGED')}
                      style={{ marginTop: '4px' }}
                    />
                    <div>
                      <span style={{ fontWeight: '600', display: 'block', fontSize: '14px', color: status === 'ACKNOWLEDGED' ? '#065f46' : 'var(--text-main)' }}>
                        Confirm Absence (Acknowledged)
                      </span>
                      <small style={{ color: status === 'ACKNOWLEDGED' ? '#047857' : 'var(--text-muted)', fontSize: '12px' }}>
                        I verify that my child is absent from school today (e.g. sick leave, scheduled event).
                      </small>
                    </div>
                  </label>

                  <label style={{ 
                    display: 'flex', 
                    padding: '12px 16px', 
                    border: '1px solid', 
                    borderColor: status === 'NEEDS_FOLLOW_UP' ? 'var(--danger-color)' : 'var(--border-color)',
                    background: status === 'NEEDS_FOLLOW_UP' ? 'var(--danger-light)' : '#ffffff',
                    borderRadius: '8px', 
                    cursor: 'pointer', 
                    alignItems: 'flex-start',
                    gap: '12px'
                  }}>
                    <input 
                      type="radio" 
                      name="status" 
                      value="NEEDS_FOLLOW_UP" 
                      checked={status === 'NEEDS_FOLLOW_UP'}
                      onChange={() => setStatus('NEEDS_FOLLOW_UP')}
                      style={{ marginTop: '4px' }}
                    />
                    <div>
                      <span style={{ fontWeight: '600', display: 'block', fontSize: '14px', color: status === 'NEEDS_FOLLOW_UP' ? '#9f1239' : 'var(--text-main)' }}>
                        Request Follow-up (Urgent Callback)
                      </span>
                      <small style={{ color: status === 'NEEDS_FOLLOW_UP' ? '#b91c1c' : 'var(--text-muted)', fontSize: '12px' }}>
                        I was unaware of this absence, or I request an official callback from the school.
                      </small>
                    </div>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: '600' }}>Remarks / Reason for Absence</label>
                <textarea 
                  className="form-textarea" 
                  rows="3"
                  placeholder="e.g. Alexander has a high fever and is resting today. Will send medical slip tomorrow."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  disabled={submitting}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ padding: '12px' }} disabled={submitting}>
                {submitting ? 'Recording response...' : 'Submit Verification Response'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

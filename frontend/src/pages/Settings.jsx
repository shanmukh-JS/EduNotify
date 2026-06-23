import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, RefreshCw, CheckCircle } from 'lucide-react';
import { api } from '../utils/api.js';

export default function Settings({ user }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    setSuccess(false);
    try {
      const data = await api.get('/settings');
      setSettings({
        notification_time: data.notification_time || '12:00:00',
        max_retries: data.max_retries !== undefined ? data.max_retries : 3,
        active_channels: data.active_channels || ['SMS', 'EMAIL']
      });
    } catch (err) {
      console.error('Fetch settings error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChannelToggle = (ch) => {
    setSettings(prev => {
      const current = prev.active_channels;
      const updated = current.includes(ch) ? current.filter(c => c !== ch) : [...current, ch];
      return { ...prev, active_channels: updated };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    try {
      await api.put('/settings', settings);
      setSuccess(true);
      fetchSettings();
    } catch (err) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const canModify = ['SUPER_ADMIN', 'PRINCIPAL'].includes(user?.role);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '600px', width: '100%', margin: '0' }}>
      <div className="glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <SettingsIcon size={24} style={{ color: 'var(--primary-color)' }} />
          <div>
            <h3 style={{ fontSize: '18px' }}>Global Notification Settings</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Configure automated scheduler times, channel limits, and failure thresholds</p>
          </div>
        </div>

        {success && (
          <div className="flex-center status-pill present" style={{ padding: '12px 24px', width: '100%', justifyContent: 'flex-start', borderRadius: 'var(--border-radius-sm)', gap: '8px', marginBottom: '20px' }}>
            <CheckCircle size={18} color="var(--success-color)" />
            <span><b>System parameters saved successfully.</b></span>
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="form-group">
            <label className="form-label">Daily Automated Execution Time</label>
            <input 
              type="time" 
              step="1"
              className="form-input" 
              value={settings.notification_time}
              onChange={(e) => setSettings({ ...settings, notification_time: e.target.value })}
              disabled={!canModify || saving}
              required
            />
            <small style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
              The daily cron scheduler automatically finalizes unmarked registers and fires alerts at this hour. (Current Default: 12:00 PM)
            </small>
          </div>

          <div className="form-group">
            <label className="form-label">Maximum Queue Retry Threshold</label>
            <input 
              type="number" 
              className="form-input" 
              min="0"
              max="10"
              value={settings.max_retries}
              onChange={(e) => setSettings({ ...settings, max_retries: parseInt(e.target.value) })}
              disabled={!canModify || saving}
              required
            />
            <small style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
              Maximum delivery attempts for failed SMS, Email, Call, or WhatsApp logs before tagging alert as permanent failure.
            </small>
          </div>

          <div className="form-group">
            <label className="form-label">Enabled Alert Distribution Channels</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
              {['SMS', 'EMAIL', 'WHATSAPP', 'CALL'].map((ch) => (
                <label key={ch} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer', fontWeight: '500' }}>
                  <input 
                    type="checkbox" 
                    checked={settings.active_channels.includes(ch)}
                    onChange={() => handleChannelToggle(ch)}
                    disabled={!canModify || saving}
                  />
                  <span>{ch} Channel</span>
                </label>
              ))}
            </div>
            <small style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
              Select channels to queue when daily class attendance registers are finalized.
            </small>
          </div>

          {canModify && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button type="submit" className="btn btn-primary" style={{ gap: '10px' }} disabled={saving}>
                <Save size={16} />
                <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

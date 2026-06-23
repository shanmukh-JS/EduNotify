import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, FileCode, X, Info } from 'lucide-react';
import { api } from '../utils/api.js';

export default function Templates({ user }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [form, setForm] = useState({
    name: 'ABSENT_NOTIFICATION',
    channel: 'SMS',
    subject: '',
    body: ''
  });

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const data = await api.get('/templates');
      setTemplates(data);
    } catch (err) {
      console.error('Fetch templates error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const openCreateModal = () => {
    setCurrentTemplate(null);
    setForm({
      name: 'ABSENT_NOTIFICATION',
      channel: 'SMS',
      subject: '',
      body: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (temp) => {
    setCurrentTemplate(temp);
    setForm({
      name: temp.name,
      channel: temp.channel,
      subject: temp.subject || '',
      body: temp.body
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this notification template?')) return;
    try {
      await api.delete(`/templates/${id}`);
      fetchTemplates();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentTemplate) {
        await api.put(`/templates/${currentTemplate.id}`, form);
      } else {
        await api.post('/templates', form);
      }
      setIsModalOpen(false);
      fetchTemplates();
    } catch (err) {
      alert(`Save failed: ${err.message}`);
    }
  };

  const canModify = ['SUPER_ADMIN', 'PRINCIPAL', 'COORDINATOR'].includes(user?.role);

  return (
    <>
      {/* Help variables banner */}
      <div className="glass-panel" style={{ background: 'var(--primary-light)', borderColor: '#bfdbfe', display: 'flex', gap: '16px' }}>
        <div style={{ background: '#3b82f6', color: '#ffffff', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Info size={20} />
        </div>
        <div style={{ fontSize: '14px' }}>
          <h4 style={{ color: '#1e3a8a', fontWeight: '700', marginBottom: '4px' }}>Supported Template Replacement Variables</h4>
          <p style={{ color: '#1e40af', marginBottom: '8px' }}>You can insert placeholders in your templates which will be dynamically replaced when attendance finalizes:</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', fontFamily: 'monospace', fontSize: '12px' }}>
            <span><b>{"{{parent_name}}"}</b> : Guardian name</span>
            <span><b>{"{{student_name}}"}</b> : Student full name</span>
            <span><b>{"{{class}}"}</b> : Grade & Section</span>
            <span><b>{"{{date}}"}</b> : Attendance date</span>
            <span><b>{"{{roll_number}}"}</b> : Student roll no.</span>
            <span><b>{"{{ack_link}}"}</b> : Two-way response URL</span>
          </div>
        </div>
      </div>

      {/* Control bar */}
      <div className="filter-bar">
        <div>
          <h3 style={{ fontSize: '15px' }}>Configure Active Message Templates</h3>
        </div>
        {canModify && (
          <button className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={16} />
            <span>Create Template</span>
          </button>
        )}
      </div>

      {/* Roster Listing Grid */}
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
          </div>
        ) : templates.length === 0 ? (
          <div className="empty-state">
            <FileCode size={48} />
            <h3>No Templates Found</h3>
            <p>Create custom message templates to begin automating notifications.</p>
          </div>
        ) : (
          <div className="table-responsive" style={{ border: 'none', borderRadius: '0' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Template Name</th>
                  <th>Channel</th>
                  <th>Email Subject</th>
                  <th>Body Template</th>
                  {canModify && <th style={{ textAlign: 'center', width: '120px' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {templates.map((temp) => (
                  <tr key={temp.id}>
                    <td><b>{temp.name}</b></td>
                    <td>
                      <span style={{ fontSize: '11px', background: 'var(--bg-primary)', padding: '4px 8px', borderRadius: '4px', fontWeight: '700' }}>
                        {temp.channel}
                      </span>
                    </td>
                    <td><span style={{ color: temp.subject ? 'var(--text-main)' : 'var(--text-muted)' }}>{temp.subject || 'N/A'}</span></td>
                    <td style={{ fontSize: '13px', maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {temp.body}
                    </td>
                    {canModify && (
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button className="btn btn-secondary" style={{ padding: '6px 10px' }} onClick={() => openEditModal(temp)}>
                            <Edit2 size={14} />
                          </button>
                          <button className="btn btn-secondary" style={{ padding: '6px 10px', color: 'var(--danger-color)', borderColor: 'rgba(244,63,94,0.1)' }} onClick={() => handleDelete(temp.id)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CRUD Overlay Form Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{currentTemplate ? 'Edit Message Template' : 'Create New Message Template'}</h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleFormSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Template Event Name</label>
                    <select className="form-select" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}>
                      <option value="ABSENT_NOTIFICATION">ABSENT_NOTIFICATION</option>
                      <option value="LATE_NOTIFICATION">LATE_NOTIFICATION</option>
                      <option value="MEETING_REMINDER">MEETING_REMINDER</option>
                      <option value="FEE_REMINDER">FEE_REMINDER</option>
                      <option value="EMERGENCY_BROADCAST">EMERGENCY_BROADCAST</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Channel Type</label>
                    <select className="form-select" value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}>
                      <option value="SMS">SMS</option>
                      <option value="EMAIL">EMAIL</option>
                      <option value="WHATSAPP">WHATSAPP</option>
                      <option value="CALL">CALL (Voice)</option>
                    </select>
                  </div>
                </div>

                {form.channel === 'EMAIL' && (
                  <div className="form-group">
                    <label className="form-label">Email Subject Heading</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      required 
                      placeholder="e.g. Attendance Notice: {{student_name}} is absent today"
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Message Content Body</label>
                  <textarea 
                    className="form-textarea" 
                    rows="6"
                    required
                    placeholder="Dear {{parent_name}}, your child {{student_name}} was marked absent today from {{class}}. Please acknowledge: {{ack_link}}"
                    value={form.body}
                    onChange={(e) => setForm({ ...form, body: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Template</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

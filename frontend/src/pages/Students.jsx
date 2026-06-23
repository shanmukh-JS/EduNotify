import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, GraduationCap, X, AlertTriangle } from 'lucide-react';
import { api } from '../utils/api.js';

export default function Students({ user }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [gradeClass, setGradeClass] = useState('');
  const [section, setSection] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStudent, setCurrentStudent] = useState(null); // Null for create, student object for edit
  const [form, setForm] = useState({
    admission_number: '',
    first_name: '',
    last_name: '',
    grade_class: 'Grade 10',
    section: 'Section A',
    roll_number: '',
    parent_name: '',
    parent_phone: '',
    parent_email: '',
    preferred_language: 'en',
    is_active: true
  });

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const data = await api.get(`/students?search=${search}&gradeClass=${gradeClass}&section=${section}`);
      setStudents(data);
    } catch (err) {
      console.error('Fetch students error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchStudents();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [search, gradeClass, section]);

  const openCreateModal = () => {
    setCurrentStudent(null);
    setForm({
      admission_number: '',
      first_name: '',
      last_name: '',
      grade_class: 'Grade 10',
      section: 'Section A',
      roll_number: '',
      parent_name: '',
      parent_phone: '',
      parent_email: '',
      preferred_language: 'en',
      is_active: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (student) => {
    setCurrentStudent(student);
    setForm({
      admission_number: student.admission_number,
      first_name: student.first_name,
      last_name: student.last_name,
      grade_class: student.grade_class,
      section: student.section,
      roll_number: student.roll_number,
      parent_name: student.parent_name,
      parent_phone: student.parent_phone,
      parent_email: student.parent_email,
      preferred_language: student.preferred_language,
      is_active: student.is_active === 1 || student.is_active === true
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (studentId) => {
    if (!window.confirm('Are you sure you want to permanently delete this student record?')) return;
    
    try {
      await api.delete(`/students/${studentId}`);
      fetchStudents();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    const payload = {
      ...form,
      roll_number: parseInt(form.roll_number)
    };

    try {
      if (currentStudent) {
        // Edit flow
        await api.put(`/students/${currentStudent.id}`, payload);
      } else {
        // Create flow
        await api.post('/students', payload);
      }
      setIsModalOpen(false);
      fetchStudents();
    } catch (err) {
      alert(`Save failed: ${err.message}`);
    }
  };

  const canModify = ['SUPER_ADMIN', 'PRINCIPAL', 'COORDINATOR'].includes(user?.role);

  return (
    <>
      {/* Search & Filter Header */}
      <div className="filter-bar">
        <div className="filter-group" style={{ flexGrow: 1, maxWidth: '500px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '11px', color: '#64748b' }} />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search by name, admission no., or parent..." 
              style={{ paddingLeft: '40px' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="filter-group">
          <select className="form-select" style={{ width: '150px' }} value={gradeClass} onChange={(e) => setGradeClass(e.target.value)}>
            <option value="">All Grades</option>
            <option value="Grade 10">Grade 10</option>
            <option value="Grade 9">Grade 9</option>
            <option value="Grade 8">Grade 8</option>
          </select>

          <select className="form-select" style={{ width: '130px' }} value={section} onChange={(e) => setSection(e.target.value)}>
            <option value="">All Sections</option>
            <option value="Section A">Section A</option>
            <option value="Section B">Section B</option>
            <option value="Section C">Section C</option>
          </select>

          {canModify && (
            <button className="btn btn-primary" onClick={openCreateModal}>
              <Plus size={16} />
              <span>Add Student</span>
            </button>
          )}
        </div>
      </div>

      {/* Roster Listing Grid */}
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading student directory records...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="empty-state">
            <GraduationCap size={48} />
            <h3>No Students Found</h3>
            <p>Try refining your search keyword or filters, or add a student to the directory.</p>
          </div>
        ) : (
          <div className="table-responsive" style={{ border: 'none', borderRadius: '0' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Admission No.</th>
                  <th>Student Name</th>
                  <th>Grade</th>
                  <th>Section</th>
                  <th>Roll No.</th>
                  <th>Parent / Guardian</th>
                  <th>Contact Info</th>
                  <th>Lang</th>
                  <th>Status</th>
                  {canModify && <th style={{ textAlign: 'center' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td><b>{student.admission_number}</b></td>
                    <td>{student.first_name} {student.last_name}</td>
                    <td>{student.grade_class}</td>
                    <td>{student.section}</td>
                    <td>#{student.roll_number}</td>
                    <td>{student.parent_name}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', fontSize: '13px' }}>
                        <span>{student.parent_phone}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{student.parent_email}</span>
                      </div>
                    </td>
                    <td><span style={{ textTransform: 'uppercase', fontSize: '12px' }}>{student.preferred_language}</span></td>
                    <td>
                      <span className={`status-pill ${student.is_active ? 'present' : 'failed'}`}>
                        {student.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    {canModify && (
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '6px 10px' }} 
                            onClick={() => openEditModal(student)}
                            title="Edit Student Profile"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '6px 10px', color: 'var(--danger-color)', borderColor: 'rgba(244,63,94,0.2)' }} 
                            onClick={() => handleDelete(student.id)}
                            title="Delete Student Profile"
                          >
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
              <h3>{currentStudent ? 'Edit Student Profile' : 'Add New Student Record'}</h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleFormSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Admission Number *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required 
                    placeholder="e.g. ADM-1025" 
                    value={form.admission_number}
                    onChange={(e) => setForm({ ...form, admission_number: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">First Name *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      required 
                      value={form.first_name}
                      onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Last Name *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      required 
                      value={form.last_name}
                      onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Grade / Class *</label>
                    <select className="form-select" value={form.grade_class} onChange={(e) => setForm({ ...form, grade_class: e.target.value })}>
                      <option value="Grade 10">Grade 10</option>
                      <option value="Grade 9">Grade 9</option>
                      <option value="Grade 8">Grade 8</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Section *</label>
                    <select className="form-select" value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })}>
                      <option value="Section A">Section A</option>
                      <option value="Section B">Section B</option>
                      <option value="Section C">Section C</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Roll Number *</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      required 
                      value={form.roll_number}
                      onChange={(e) => setForm({ ...form, roll_number: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '16px' }}>
                  <label className="form-label">Parent / Guardian Full Name *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required 
                    value={form.parent_name}
                    onChange={(e) => setForm({ ...form, parent_name: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Parent Mobile Number *</label>
                    <input 
                      type="tel" 
                      className="form-input" 
                      required 
                      placeholder="+15550100" 
                      value={form.parent_phone}
                      onChange={(e) => setForm({ ...form, parent_phone: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Parent Email Address *</label>
                    <input 
                      type="email" 
                      className="form-input" 
                      required 
                      placeholder="parent@example.com" 
                      value={form.parent_email}
                      onChange={(e) => setForm({ ...form, parent_email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Preferred Communication Language</label>
                    <select className="form-select" value={form.preferred_language} onChange={(e) => setForm({ ...form, preferred_language: e.target.value })}>
                      <option value="en">English (en)</option>
                      <option value="es">Español (es)</option>
                      <option value="fr">Français (fr)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Active Status</label>
                    <div style={{ display: 'flex', alignItems: 'center', height: '100%', gap: '10px' }}>
                      <input 
                        type="checkbox" 
                        id="is_active_chk" 
                        checked={form.is_active}
                        onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                      />
                      <label htmlFor="is_active_chk" style={{ fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>Is Active Student</label>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

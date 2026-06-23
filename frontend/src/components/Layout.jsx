import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  CalendarCheck, 
  PhoneCall, 
  FileCode, 
  Settings, 
  Radio, 
  FileText, 
  LogOut, 
  GraduationCap,
  Clock
} from 'lucide-react';
import { api } from '../utils/api.js';

export default function Layout({ children, currentPage, setCurrentPage, user, onLogout }) {
  if (!user) return <>{children}</>;

  // Define sidebar menu options and their role restrictions
  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'PRINCIPAL', 'COORDINATOR', 'TEACHER'] },
    { id: 'students', name: 'Student Registry', icon: Users, roles: ['SUPER_ADMIN', 'PRINCIPAL', 'COORDINATOR'] },
    { id: 'attendance', name: 'Attendance Board', icon: CalendarCheck, roles: ['SUPER_ADMIN', 'PRINCIPAL', 'COORDINATOR', 'TEACHER'] },
    { id: 'absentees', name: "Today's Absentees", icon: Clock, roles: ['SUPER_ADMIN', 'PRINCIPAL', 'COORDINATOR', 'TEACHER'] },
    { id: 'call-logs', name: 'Call Telemetry', icon: PhoneCall, roles: ['SUPER_ADMIN', 'PRINCIPAL', 'COORDINATOR', 'TEACHER'] },
    { id: 'broadcast', name: 'Broadcast Center', icon: Radio, roles: ['SUPER_ADMIN', 'PRINCIPAL'] },
    { id: 'templates', name: 'Message Templates', icon: FileCode, roles: ['SUPER_ADMIN', 'PRINCIPAL', 'COORDINATOR'] },
    { id: 'audit-logs', name: 'Audit Trails', icon: FileText, roles: ['SUPER_ADMIN', 'PRINCIPAL'] },
    { id: 'settings', name: 'System Settings', icon: Settings, roles: ['SUPER_ADMIN', 'PRINCIPAL'] }
  ];

  // Filter items matching current user role
  const visibleMenuItems = menuItems.filter(item => item.roles.includes(user.role));

  const formatRole = (role) => {
    return role ? role.replace('_', ' ') : '';
  };

  return (
    <div className="app-layout">
      {/* Sidebar Panel */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <GraduationCap size={32} color="#6366f1" />
          <h2>EduNotify</h2>
        </div>
        
        <ul className="sidebar-menu">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <a 
                  className={`sidebar-item ${currentPage === item.id ? 'active' : ''}`}
                  onClick={() => setCurrentPage(item.id)}
                >
                  <Icon size={20} />
                  <span>{item.name}</span>
                </a>
              </li>
            );
          })}
        </ul>

        <div className="sidebar-footer">
          <button className="logout-btn" style={{ width: '100%', justifyContent: 'flex-start', border: 'none', color: '#94a3b8' }} onClick={onLogout}>
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Panel Content Container */}
      <div className="main-container">
        {/* Top Header Navigation */}
        <header className="header-nav">
          <div className="header-title">
            <h2 style={{ textTransform: 'capitalize' }}>
              {currentPage.replace('-', ' ')}
            </h2>
          </div>

          <div className="header-user">
            <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-muted)' }}>
              {user.school_name}
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span style={{ fontSize: '14px', fontWeight: '600' }}>{user.full_name}</span>
              <span className={`role-badge ${user.role.toLowerCase()}`}>
                {formatRole(user.role)}
              </span>
            </div>
            <button className="logout-btn" onClick={onLogout}>
              <LogOut size={16} />
              <span>Log out</span>
            </button>
          </div>
        </header>

        {/* Content Wrapper */}
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
}

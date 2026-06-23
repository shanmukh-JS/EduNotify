import React, { useState, useEffect } from 'react';
import { api } from './utils/api.js';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Students from './pages/Students.jsx';
import Attendance from './pages/Attendance.jsx';
import Absentees from './pages/Absentees.jsx';
import CallLogs from './pages/CallLogs.jsx';
import Broadcast from './pages/Broadcast.jsx';
import Templates from './pages/Templates.jsx';
import AuditLogs from './pages/AuditLogs.jsx';
import Settings from './pages/Settings.jsx';
import Acknowledge from './pages/Acknowledge.jsx';

/**
 * Standard React class-based Error Boundary to intercept page crashes 
 * and display a descriptive error screen with stack trace for auditing.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught a React rendering crash:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '24px', 
          background: '#fff1f2', 
          border: '1px solid #fecdd3', 
          color: '#be123c', 
          borderRadius: '12px', 
          margin: '24px' 
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>React Component Runtime Crash</h3>
          <p style={{ fontWeight: '500', marginBottom: '12px' }}>{this.state.error?.toString()}</p>
          <pre style={{ 
            fontSize: '12px', 
            background: '#0f172a', 
            color: '#f43f5e', 
            padding: '16px', 
            borderRadius: '6px', 
            overflowX: 'auto',
            maxHeight: '400px'
          }}>
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [parentNotificationId, setParentNotificationId] = useState(null);

  // Check URL routes on initial load to handle public parent links
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/acknowledge/')) {
      const parts = path.split('/');
      const id = parts[parts.length - 1];
      if (id) {
        setParentNotificationId(id);
      }
    } else {
      // Check for active admin session token
      const sessionUser = api.getUser();
      const token = api.getToken();
      if (sessionUser && token) {
        setUser(sessionUser);
      }
    }
  }, []);

  const handleLoginSuccess = (authenticatedUser) => {
    setUser(authenticatedUser);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    api.clearToken();
    api.clearUser();
    setUser(null);
  };

  // 1. Render Public Parent Feedback Portal if matching path
  if (parentNotificationId) {
    return (
      <ErrorBoundary>
        <Acknowledge notificationId={parentNotificationId} />
      </ErrorBoundary>
    );
  }

  // 2. Render Login Screen if not authenticated
  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // 3. Render Administrative ERP UI (Sidebar + Tab Pages)
  return (
    <Layout 
      currentPage={currentPage} 
      setCurrentPage={setCurrentPage} 
      user={user} 
      onLogout={handleLogout}
    >
      <ErrorBoundary key={currentPage}>
        {currentPage === 'dashboard' && <Dashboard />}
        {currentPage === 'students' && <Students user={user} />}
        {currentPage === 'attendance' && <Attendance user={user} />}
        {currentPage === 'absentees' && <Absentees />}
        {currentPage === 'call-logs' && <CallLogs />}
        {currentPage === 'broadcast' && <Broadcast user={user} />}
        {currentPage === 'templates' && <Templates user={user} />}
        {currentPage === 'audit-logs' && <AuditLogs />}
        {currentPage === 'settings' && <Settings user={user} />}
      </ErrorBoundary>
    </Layout>
  );
}

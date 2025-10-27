import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import './styles/App.css';

// Import components
import Dashboard from './components/Dashboard';
import IncomingStock from './components/IncomingStock';
import Cutting from './components/Cutting';
import Forging from './components/Forging';  // ADD THIS LINE

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

function AppContent() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();

  const navItems = [
    { path: '/', icon: '📊', label: 'Dashboard', color: '#667eea' },
    { path: '/incoming-stock', icon: '📦', label: 'Incoming Stock', color: '#48bb78' },
    { path: '/cutting', icon: '✂️', label: 'Cutting', color: '#ed8936' },
    { path: '/forging', icon: '🔨', label: 'Forging', color: '#9f7aea' }  // ADD THIS LINE
  ];

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'Dashboard';
      case '/incoming-stock': return 'Incoming Stock Management';
      case '/cutting': return 'Cutting Operations';
      case '/forging': return 'Forging Operations';  // ADD THIS LINE
      default: return 'Forge ERP';
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-gradient"></div>

        <div className="sidebar-content">
          <div className="sidebar-header">
            <div className="logo-container">
              <div className="logo-icon">🏭</div>
              {isSidebarOpen && (
                <div className="logo-text">
                  <h2>Forge ERP</h2>
                  <p>Manufacturing System</p>
                </div>
              )}
            </div>
          </div>

          <nav className="sidebar-nav">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                style={{ '--nav-color': item.color }}
              >
                <div className="nav-icon-wrapper">
                  <span className="nav-icon">{item.icon}</span>
                </div>
                {isSidebarOpen && (
                  <span className="nav-label">{item.label}</span>
                )}
                {location.pathname === item.path && (
                  <div className="active-indicator"></div>
                )}
              </Link>
            ))}
          </nav>

          <div className="sidebar-footer">
            <div className="user-profile">
              <div className="user-avatar">👤</div>
              {isSidebarOpen && (
                <div className="user-info">
                  <p className="user-name">Admin User</p>
                  <p className="user-role">Administrator</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`main-content ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {/* Top Bar */}
        <div className="top-bar">
          <div className="top-bar-left">
            <button
              className="sidebar-toggle"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <span className="hamburger-icon">
                <span></span>
                <span></span>
                <span></span>
              </span>
            </button>
            <h1 className="page-title">{getPageTitle()}</h1>
          </div>

          <div className="top-bar-right">
            <button className="notification-btn">
              🔔
              <span className="notification-badge">3</span>
            </button>
            <button className="settings-btn">⚙️</button>
          </div>
        </div>

        {/* Content Wrapper */}
        <div className="content-wrapper">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/incoming-stock" element={<IncomingStock />} />
            <Route path="/cutting" element={<Cutting />} />
            <Route path="/forging" element={<Forging />} />  {/* ADD THIS LINE */}
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default App;

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import './styles/App.css';

// Import components
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './components/Dashboard';
import IncomingStock from './components/IncomingStock';
import Cutting from './components/Cutting';
import Forging from './components/Forging';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes */}
        <Route path="/*" element={
          <ProtectedRoute>
            <AppContent />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

function AppContent() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/dashboard', icon: '📊', label: 'Dashboard', color: '#667eea', shortcut: 'D' },
    { path: '/incoming-stock', icon: '📦', label: 'Incoming Stock', color: '#48bb78', shortcut: 'S' },
    { path: '/cutting', icon: '✂️', label: 'Cutting', color: '#ed8936', shortcut: 'C' },
    { path: '/forging', icon: '🔨', label: 'Forging', color: '#9f7aea', shortcut: 'F' }
  ];

  // Keyboard shortcuts effect
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Check if user is typing in an input field
      if (e.target.tagName === 'INPUT' || 
          e.target.tagName === 'TEXTAREA' || 
          e.target.tagName === 'SELECT') {
        return;
      }

      // Alt key combinations for navigation
      if (e.altKey) {
        switch(e.key.toLowerCase()) {
          case 'd':
            e.preventDefault();
            navigate('/dashboard');
            break;
          case 's':
            e.preventDefault();
            navigate('/incoming-stock');
            break;
          case 'c':
            e.preventDefault();
            navigate('/cutting');
            break;
          case 'f':
            e.preventDefault();
            navigate('/forging');
            break;
          default:
            break;
        }
      }

      // Ctrl + N for "New" actions based on current page
      if (e.ctrlKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        triggerAddAction();
      }

      // Ctrl + K to toggle sidebar
      if (e.ctrlKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSidebarOpen(!isSidebarOpen);
      }

      // Show shortcuts with Ctrl + /
      if (e.ctrlKey && e.key === '/') {
        e.preventDefault();
        setShowShortcuts(!showShortcuts);
      }

      // Escape to close modals/shortcuts
      if (e.key === 'Escape') {
        setShowShortcuts(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [navigate, isSidebarOpen, showShortcuts, location.pathname]);

  // Trigger add action based on current page
  const triggerAddAction = () => {
    const event = new CustomEvent('triggerAddNew');
    window.dispatchEvent(event);
  };

  const getPageInfo = () => {
    switch(location.pathname) {
      case '/dashboard': 
        return { 
          title: 'Dashboard', 
          description: 'Overview of all operations',
          icon: '📊'
        };
      case '/incoming-stock': 
        return { 
          title: 'Incoming Stock', 
          description: 'Raw material inventory management',
          icon: '📦'
        };
      case '/cutting': 
        return { 
          title: 'Cutting Operations', 
          description: 'Sharing & Circular cutting processes',
          icon: '✂️'
        };
      case '/forging': 
        return { 
          title: 'Forging Operations', 
          description: 'Complete forging traceability',
          icon: '🔨'
        };
      default: 
        return { 
          title: 'Forge ERP', 
          description: 'Manufacturing Management',
          icon: '🏭'
        };
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const pageInfo = getPageInfo();

  return (
    <div className="app-container">
      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div className="shortcuts-overlay" onClick={() => setShowShortcuts(false)}>
          <div className="shortcuts-modal" onClick={(e) => e.stopPropagation()}>
            <div className="shortcuts-header">
              <h2>⌨️ Keyboard Shortcuts</h2>
              <button className="close-shortcuts" onClick={() => setShowShortcuts(false)}>
                ✖
              </button>
            </div>
            <div className="shortcuts-content">
              <div className="shortcuts-section">
                <h3>Navigation</h3>
                <div className="shortcut-list">
                  <div className="shortcut-item">
                    <div className="shortcut-keys">
                      <kbd>Alt</kbd> + <kbd>D</kbd>
                    </div>
                    <span className="shortcut-description">Go to Dashboard</span>
                  </div>
                  <div className="shortcut-item">
                    <div className="shortcut-keys">
                      <kbd>Alt</kbd> + <kbd>S</kbd>
                    </div>
                    <span className="shortcut-description">Go to Incoming Stock</span>
                  </div>
                  <div className="shortcut-item">
                    <div className="shortcut-keys">
                      <kbd>Alt</kbd> + <kbd>C</kbd>
                    </div>
                    <span className="shortcut-description">Go to Cutting</span>
                  </div>
                  <div className="shortcut-item">
                    <div className="shortcut-keys">
                      <kbd>Alt</kbd> + <kbd>F</kbd>
                    </div>
                    <span className="shortcut-description">Go to Forging</span>
                  </div>
                </div>
              </div>

              <div className="shortcuts-section">
                <h3>Quick Actions</h3>
                <div className="shortcut-list">
                  <div className="shortcut-item">
                    <div className="shortcut-keys">
                      <kbd>Ctrl</kbd> + <kbd>N</kbd>
                    </div>
                    <span className="shortcut-description">Add New (Current Page)</span>
                  </div>
                  <div className="shortcut-item">
                    <div className="shortcut-keys">
                      <kbd>Ctrl</kbd> + <kbd>K</kbd>
                    </div>
                    <span className="shortcut-description">Toggle Sidebar</span>
                  </div>
                  <div className="shortcut-item">
                    <div className="shortcut-keys">
                      <kbd>Ctrl</kbd> + <kbd>/</kbd>
                    </div>
                    <span className="shortcut-description">Show Shortcuts</span>
                  </div>
                  <div className="shortcut-item">
                    <div className="shortcut-keys">
                      <kbd>Esc</kbd>
                    </div>
                    <span className="shortcut-description">Close Modal/Dialog</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-gradient"></div>
        
        <div className="sidebar-content">
          {/* Sidebar Header */}
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

          {/* Navigation */}
          <nav className="sidebar-nav">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                style={{'--nav-color': item.color}}
                title={`${item.label} (Alt + ${item.shortcut})`}
              >
                <div className="nav-icon-wrapper">
                  <span className="nav-icon">{item.icon}</span>
                </div>
                {isSidebarOpen && (
                  <div className="nav-content-wrapper">
                    <span className="nav-label">{item.label}</span>
                    <span className="nav-shortcut">Alt+{item.shortcut}</span>
                  </div>
                )}
                {location.pathname === item.path && (
                  <div className="active-indicator"></div>
                )}
              </Link>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="sidebar-footer">
            <div className="user-profile-sidebar">
              <div className="user-avatar-sidebar">
                {user.name ? user.name.charAt(0).toUpperCase() : '👤'}
              </div>
              {isSidebarOpen && (
                <div className="user-info-sidebar">
                  <p className="user-name-sidebar">{user.name || 'User'}</p>
                  <p className="user-role-sidebar">{user.role || 'Admin'}</p>
                  {user.company && (
                    <p className="user-company-sidebar">{user.company}</p>
                  )}
                </div>
              )}
            </div>
            {isSidebarOpen && (
              <button className="logout-btn-sidebar" onClick={handleLogout}>
                <span className="logout-icon">🚪</span>
                <span>Logout</span>
              </button>
            )}
            {!isSidebarOpen && (
              <button 
                className="logout-btn-sidebar-mini" 
                onClick={handleLogout}
                title="Logout"
              >
                🚪
              </button>
            )}
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
              title="Toggle Sidebar (Ctrl + K)"
            >
              <span className="hamburger-icon">
                <span></span>
                <span></span>
                <span></span>
              </span>
            </button>
            <div className="page-info">
              <div className="page-title-wrapper">
                <span className="page-icon">{pageInfo.icon}</span>
                <h1 className="page-title">{pageInfo.title}</h1>
              </div>
              <p className="page-description">{pageInfo.description}</p>
            </div>
          </div>

          <div className="top-bar-right">
            <button 
              className="shortcuts-btn"
              onClick={() => setShowShortcuts(true)}
              title="Show Keyboard Shortcuts (Ctrl + /)"
            >
              <span className="keyboard-icon">⌨️</span>
              <span className="shortcuts-text">Shortcuts</span>
            </button>
            <div className="quick-stats-top">
              <div className="stat-mini">
                <span className="stat-mini-label">Stock</span>
                <span className="stat-mini-value">Live</span>
              </div>
              <div className="stat-mini">
                <span className="stat-mini-label">Status</span>
                <span className="stat-mini-value online">Online</span>
              </div>
            </div>
            <div className="user-badge-top">
              <div className="user-avatar-top">
                {user.name ? user.name.charAt(0).toUpperCase() : '👤'}
              </div>
              {user.name && (
                <div className="user-info-top">
                  <span className="user-name-text">{user.name}</span>
                  <span className="user-role-text">{user.role || 'Admin'}</span>
                </div>
              )}
            </div>
            <button className="logout-btn-top" onClick={handleLogout} title="Logout">
              <span>🚪</span>
            </button>
          </div>
        </div>

        {/* Content Wrapper */}
        <div className="content-wrapper">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/incoming-stock" element={<IncomingStock />} />
            <Route path="/cutting" element={<Cutting />} />
            <Route path="/forging" element={<Forging />} />
          </Routes>
        </div>

        {/* Footer */}
        <footer className="app-footer">
          <div className="footer-left">
            <p>© 2025 Forge ERP. All rights reserved.</p>
            <p className="footer-tagline">Manufacturing Excellence</p>
          </div>
          <div className="footer-right">
            <span className="version-badge">v2.0.0</span>
            <span className="status-badge">
              <span className="status-dot"></span>
              System Online
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default App;

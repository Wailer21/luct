// App.jsx - Complete Role-Based Access Control
import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ReportForm from './pages/ReportForm';
import Reports from './pages/Reports';
import Courses from './pages/Courses';
import Feedback from './pages/Feedback';
import Rating from './pages/Rating';
import Search from './pages/Search';
import { AuthProvider, useAuth } from './utils/auth';

// Navigation Component with Dynamic Role-Based Menu
function Navigation() {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  const isActiveRoute = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  // Comprehensive role-based menu configuration
  const getMenuItems = () => {
    if (!user) return [];

    const menuConfig = {
      common: [
        { path: '/reports', label: 'Reports', icon: 'clipboard-list', roles: ['Student', 'Lecturer', 'PRL', 'PL', 'Admin'] },
        { path: '/search', label: 'Search', icon: 'search', roles: ['Student', 'Lecturer', 'PRL', 'PL', 'Admin'] }
      ],
      Student: [
        { path: '/rating', label: 'Ratings', icon: 'star' },
        { path: '/monitoring', label: 'My Progress', icon: 'chart-line' }
      ],
      Lecturer: [
        { path: '/report', label: 'New Report', icon: 'plus-circle' },
        { path: '/rating', label: 'My Ratings', icon: 'star' },
        { path: '/my-classes', label: 'My Classes', icon: 'chalkboard-teacher' }
      ],
      PRL: [
        { path: '/courses', label: 'Courses', icon: 'book' },
        { path: '/feedback', label: 'Feedback', icon: 'comment' },
        { path: '/analytics', label: 'Analytics', icon: 'chart-bar' }
      ],
      PL: [
        { path: '/courses', label: 'Courses', icon: 'book' },
        { path: '/feedback', label: 'Feedback', icon: 'comment' },
        { path: '/classes', label: 'Classes', icon: 'users' }
      ],
      Admin: [
        { path: '/courses', label: 'Courses', icon: 'book' },
        { path: '/feedback', label: 'Feedback', icon: 'comment' },
        { path: '/users', label: 'Users', icon: 'users-cog' },
        { path: '/analytics', label: 'Analytics', icon: 'chart-bar' }
      ]
    };

    return [
      ...menuConfig.common.filter(item => item.roles.includes(user.role)),
      ...(menuConfig[user.role] || [])
    ];
  };

  const menuItems = getMenuItems();

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
      <div className="container">
        {/* Brand */}
        <Link className="navbar-brand fw-bold d-flex align-items-center" to="/">
          <i className="fas fa-university me-2"></i>
          LUCT Reports
        </Link>

        {/* Mobile Toggle */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Navigation Items */}
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link 
                className={`nav-link ${isActiveRoute('/')}`} 
                to="/"
              >
                <i className="fas fa-home me-1"></i>
                Home
              </Link>
            </li>
            
            {/* Dynamic Role-Based Menu Items */}
            {isAuthenticated && menuItems.map((item, index) => (
              <li key={index} className="nav-item">
                <Link 
                  className={`nav-link ${isActiveRoute(item.path)}`} 
                  to={item.path}
                >
                  <i className={`fas fa-${item.icon} me-1`}></i>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* User Section */}
          <ul className="navbar-nav">
            {isAuthenticated ? (
              <li className="nav-item dropdown">
                <a
                  className="nav-link dropdown-toggle d-flex align-items-center"
                  href="#"
                  id="navbarDropdown"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <i className="fas fa-user-circle me-2"></i>
                  <span className="d-none d-md-inline">
                    {user?.first_name} {user?.last_name}
                  </span>
                  <span className="badge bg-light text-dark ms-2 text-capitalize">
                    {user?.role}
                  </span>
                </a>
                <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdown">
                  <li>
                    <span className="dropdown-item-text">
                      <small className="text-muted">Signed in as</small>
                      <br />
                      <strong>{user?.first_name} {user?.last_name}</strong>
                      <br />
                      <span className="text-capitalize text-primary">{user?.role}</span>
                    </span>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  
                  {/* Common dropdown items for all roles */}
                  <li>
                    <Link className="dropdown-item" to="/reports">
                      <i className="fas fa-chart-bar me-2"></i>
                      View Reports
                    </Link>
                  </li>
                  
                  {/* Role-specific dropdown items */}
                  {user?.role === 'Lecturer' && (
                    <>
                      <li>
                        <Link className="dropdown-item" to="/report">
                          <i className="fas fa-plus me-2"></i>
                          New Report
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item" to="/my-classes">
                          <i className="fas fa-chalkboard me-2"></i>
                          My Classes
                        </Link>
                      </li>
                    </>
                  )}

                  {user?.role === 'Student' && (
                    <li>
                      <Link className="dropdown-item" to="/monitoring">
                        <i className="fas fa-chart-line me-2"></i>
                        My Progress
                      </Link>
                    </li>
                  )}

                  {['PRL', 'PL', 'Admin'].includes(user?.role) && (
                    <>
                      <li>
                        <Link className="dropdown-item" to="/courses">
                          <i className="fas fa-book me-2"></i>
                          Course Management
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item" to="/feedback">
                          <i className="fas fa-comments me-2"></i>
                          Feedback System
                        </Link>
                      </li>
                    </>
                  )}

                  {user?.role === 'Admin' && (
                    <li>
                      <Link className="dropdown-item" to="/users">
                        <i className="fas fa-users-cog me-2"></i>
                        User Management
                      </Link>
                    </li>
                  )}

                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button 
                      className="dropdown-item text-danger" 
                      onClick={handleLogout}
                    >
                      <i className="fas fa-sign-out-alt me-2"></i>
                      Logout
                    </button>
                  </li>
                </ul>
              </li>
            ) : (
              /* Show login/register only when NOT authenticated */
              <>
                <li className="nav-item">
                  <Link 
                    className={`nav-link ${isActiveRoute('/login')}`} 
                    to="/login"
                  >
                    <i className="fas fa-sign-in-alt me-1"></i>
                    Login
                  </Link>
                </li>
                <li className="nav-item">
                  <Link 
                    className={`nav-link ${isActiveRoute('/register')}`} 
                    to="/register"
                  >
                    <i className="fas fa-user-plus me-1"></i>
                    Register
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}

// Enhanced Private Route with Role-Based Access
function PrivateRoute({ children, roles = [] }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <span className="ms-2 text-muted">Checking authentication...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (roles.length > 0 && !roles.includes(user.role)) {
    return (
      <div className="container mt-5">
        <div className="card border-danger shadow">
          <div className="card-body text-center py-5">
            <i className="fas fa-ban fa-4x text-danger mb-3"></i>
            <h4 className="text-danger mb-3">Access Denied</h4>
            <p className="text-muted mb-4">
              You don't have permission to access this page with your current role.
            </p>
            <div className="alert alert-warning mx-auto" style={{ maxWidth: '400px' }}>
              <p className="mb-1">
                <strong>Required Role:</strong> {roles.join(' or ')}
              </p>
              <p className="mb-0">
                <strong>Your Role:</strong> <span className="text-capitalize badge bg-primary">{user.role}</span>
              </p>
            </div>
            <div className="mt-4">
              <Link to="/" className="btn btn-primary me-2">
                <i className="fas fa-home me-2"></i>
                Back to Home
              </Link>
              <Link to="/reports" className="btn btn-outline-primary">
                <i className="fas fa-clipboard-list me-2"></i>
                View Reports
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return children;
}

// Public Route Component
function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// 404 Component
function NotFound() {
  const { user } = useAuth();
  
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6 text-center">
          <div className="card shadow border-0">
            <div className="card-body py-5">
              <i className="fas fa-exclamation-triangle fa-4x text-warning mb-4"></i>
              <h2 className="text-primary mb-3">Page Not Found</h2>
              <p className="text-muted mb-4">
                {user ? 
                  "The page you're looking for doesn't exist or you don't have access to it." :
                  "The page you're looking for doesn't exist. Please log in to access the system."
                }
              </p>
              <div className="d-flex gap-2 justify-content-center">
                <Link to="/" className="btn btn-primary">
                  <i className="fas fa-home me-2"></i>
                  Back to Home
                </Link>
                {user && (
                  <Link to="/reports" className="btn btn-outline-primary">
                    <i className="fas fa-clipboard-list me-2"></i>
                    View Reports
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Footer Component
function Footer() {
  const { user } = useAuth();
  
  return (
    <footer className="bg-dark text-white mt-5">
      <div className="container py-4">
        <div className="row">
          <div className="col-md-6">
            <h5 className="fw-bold">
              <i className="fas fa-university me-2"></i>
              LUCT Reporting System
            </h5>
            <p className="text-light mb-0">
              {user ? 
                `Role-based access for ${user.role.toLowerCase()}s` : 
                'Academic reporting and management system'
              }
            </p>
          </div>
          <div className="col-md-6 text-md-end">
            <p className="text-light mb-0">
              &copy; 2024 Limkokwing University. All rights reserved.
            </p>
            <small className="text-muted">
              Secure Role-Based Access Platform
            </small>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Main App Content with Comprehensive Role-Based Routing
function AppContent() {
  return (
    <div className="min-vh-100 bg-light">
      <Navigation />
      
      <main className="container-fluid px-0">
        <Routes>
          {/* Public Route - Accessible to all */}
          <Route path="/" element={<Home />} />
          
          {/* Public Routes - Only accessible when NOT logged in */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          <Route 
            path="/register" 
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } 
          />

          {/* Protected Routes with Comprehensive Role-Based Access */}
          
          {/* Reports - Different views based on role */}
          <Route
            path="/reports"
            element={
              <PrivateRoute roles={['Student', 'Lecturer', 'PRL', 'PL', 'Admin']}>
                <Reports />
              </PrivateRoute>
            }
          />

          {/* Search - Accessible to all authenticated users */}
          <Route
            path="/search"
            element={
              <PrivateRoute roles={['Student', 'Lecturer', 'PRL', 'PL', 'Admin']}>
                <Search />
              </PrivateRoute>
            }
          />

          {/* Lecturer Only Routes */}
          <Route
            path="/report"
            element={
              <PrivateRoute roles={['Lecturer']}>
                <ReportForm />
              </PrivateRoute>
            }
          />

          <Route
            path="/my-classes"
            element={
              <PrivateRoute roles={['Lecturer']}>
                <Reports view="my-classes" />
              </PrivateRoute>
            }
          />

          {/* Rating - Different functionality based on role */}
          <Route
            path="/rating"
            element={
              <PrivateRoute roles={['Student', 'Lecturer', 'PRL', 'PL', 'Admin']}>
                <Rating />
              </PrivateRoute>
            }
          />

          {/* Student Specific Routes */}
          <Route
            path="/monitoring"
            element={
              <PrivateRoute roles={['Student']}>
                <Reports view="monitoring" />
              </PrivateRoute>
            }
          />

          {/* Course Management - PRL, PL, Admin only */}
          <Route
            path="/courses"
            element={
              <PrivateRoute roles={['PL', 'PRL', 'Admin']}>
                <Courses />
              </PrivateRoute>
            }
          />

          {/* Feedback System - PRL, PL, Admin only */}
          <Route
            path="/feedback"
            element={
              <PrivateRoute roles={['PRL', 'PL', 'Admin']}>
                <Feedback />
              </PrivateRoute>
            }
          />

          {/* Class Management - PL only */}
          <Route
            path="/classes"
            element={
              <PrivateRoute roles={['PL']}>
                <div className="container-fluid py-4">
                  <div className="card shadow border-0">
                    <div className="card-body text-center py-5">
                      <i className="fas fa-users fa-4x text-primary mb-3"></i>
                      <h4 className="text-primary">Class Management</h4>
                      <p className="text-muted">PL-specific class management interface</p>
                    </div>
                  </div>
                </div>
              </PrivateRoute>
            }
          />

          {/* Analytics - PRL and Admin only */}
          <Route
            path="/analytics"
            element={
              <PrivateRoute roles={['PRL', 'Admin']}>
                <div className="container-fluid py-4">
                  <div className="card shadow border-0">
                    <div className="card-body text-center py-5">
                      <i className="fas fa-chart-bar fa-4x text-success mb-3"></i>
                      <h4 className="text-success">Advanced Analytics</h4>
                      <p className="text-muted">PRL and Admin analytics dashboard</p>
                    </div>
                  </div>
                </div>
              </PrivateRoute>
            }
          />

          {/* User Management - Admin only */}
          <Route
            path="/users"
            element={
              <PrivateRoute roles={['Admin']}>
                <div className="container-fluid py-4">
                  <div className="card shadow border-0">
                    <div className="card-body text-center py-5">
                      <i className="fas fa-users-cog fa-4x text-info mb-3"></i>
                      <h4 className="text-info">User Management</h4>
                      <p className="text-muted">Admin-only user management system</p>
                    </div>
                  </div>
                </div>
              </PrivateRoute>
            }
          />

          {/* Catch all route - 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

// Main App Export
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}
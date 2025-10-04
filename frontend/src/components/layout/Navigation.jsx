import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../utils/auth';

export default function Navigation() {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActiveRoute = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  const getMenuItems = () => {
    if (!user) return [];

    const baseMenu = [
      { path: '/reports', label: 'Reports', icon: 'clipboard-list', roles: ['Student', 'Lecturer', 'PRL', 'PL', 'Admin'] },
      { path: '/search', label: 'Search', icon: 'search', roles: ['Student', 'Lecturer', 'PRL', 'PL', 'Admin'] },
      { path: '/rating', label: 'Ratings', icon: 'star', roles: ['Student', 'Lecturer', 'PRL', 'PL', 'Admin'] }
    ];

    const roleSpecificMenu = {
      Student: [
        { path: '/monitoring', label: 'My Progress', icon: 'chart-line' },
        { path: '/attendance', label: 'Attendance', icon: 'calendar-check' }
      ],
      Lecturer: [
        { path: '/report', label: 'New Report', icon: 'plus-circle' },
        { path: '/my-classes', label: 'My Classes', icon: 'chalkboard-teacher' }
      ],
      PRL: [
        { path: '/prl-courses', label: 'Courses', icon: 'book' },
        { path: '/prl-classes', label: 'Classes', icon: 'users' },
        { path: '/analytics', label: 'Analytics', icon: 'chart-bar' }
      ],
      PL: [
        { path: '/pl-courses', label: 'Courses', icon: 'book' },
        { path: '/classes', label: 'Classes', icon: 'users' }
      ],
      Admin: [
        { path: '/courses', label: 'Courses', icon: 'book' },
        { path: '/users', label: 'Users', icon: 'users-cog' },
        { path: '/analytics', label: 'Analytics', icon: 'chart-bar' }
      ]
    };

    return [
      ...baseMenu.filter(item => item.roles.includes(user.role)),
      ...(roleSpecificMenu[user.role] || [])
    ];
  };

  const menuItems = getMenuItems();

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
      <div className="container">
        <Link className="navbar-brand fw-bold d-flex align-items-center" to="/">
          <i className="fas fa-university me-2"></i>
          LUCT Reports
        </Link>

        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link className={`nav-link ${isActiveRoute('/')}`} to="/">
                <i className="fas fa-home me-1"></i>
                Home
              </Link>
            </li>
            
            {isAuthenticated && menuItems.map((item, index) => (
              <li key={index} className="nav-item">
                <Link className={`nav-link ${isActiveRoute(item.path)}`} to={item.path}>
                  <i className={`fas fa-${item.icon} me-1`}></i>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <ul className="navbar-nav">
            {isAuthenticated ? (
              <li className="nav-item dropdown">
                <a className="nav-link dropdown-toggle d-flex align-items-center" href="#" role="button" data-bs-toggle="dropdown">
                  <i className="fas fa-user-circle me-2"></i>
                  <span className="d-none d-md-inline">
                    {user?.first_name} {user?.last_name}
                  </span>
                  <span className="badge bg-light text-dark ms-2 text-capitalize">
                    {user?.role}
                  </span>
                </a>
                <ul className="dropdown-menu dropdown-menu-end">
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
                  <li>
                    <button className="dropdown-item text-danger" onClick={handleLogout}>
                      <i className="fas fa-sign-out-alt me-2"></i>
                      Logout
                    </button>
                  </li>
                </ul>
              </li>
            ) : (
              <>
                <li className="nav-item">
                  <Link className={`nav-link ${isActiveRoute('/login')}`} to="/login">
                    <i className="fas fa-sign-in-alt me-1"></i>
                    Login
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className={`nav-link ${isActiveRoute('/register')}`} to="/register">
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
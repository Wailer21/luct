import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './auth';

export default function PrivateRoute({ children, roles = [] }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
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
        <div className="alert alert-danger text-center">
          <h4>Access Denied</h4>
          <p>You don't have permission to access this page. Required roles: {roles.join(', ')}</p>
          <p>Your role: {user.role}</p>
        </div>
      </div>
    );
  }

  return children;
}
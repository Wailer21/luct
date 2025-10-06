import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../utils/auth';

export default function PrivateRoute({ children, roles = [] }) {
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
              <button onClick={() => window.history.back()} className="btn btn-primary me-2">
                <i className="fas fa-arrow-left me-2"></i>
                Go Back
              </button>
              <button onClick={() => window.location.href = '/'} className="btn btn-outline-primary">
                <i className="fas fa-home me-2"></i>
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
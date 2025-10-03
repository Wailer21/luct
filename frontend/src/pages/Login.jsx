import React, { useState } from 'react';
import { useAuth } from '../utils/auth';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { api, API_ENDPOINTS } from '../utils/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Basic validation
    if (!email || !password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post(API_ENDPOINTS.LOGIN, { email, password });

      if (response.success) {
        auth.saveLogin(response.data.token, response.data.user);
        navigate(from, { replace: true });
      } else {
        setError(response.message || 'Login failed. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-fluid py-5 bg-light min-vh-100">
      <div className="row justify-content-center align-items-center min-vh-100">
        <div className="col-md-6 col-lg-5 col-xl-4">
          <div className="card shadow border-0 rounded-4 overflow-hidden">
            <div className="card-header bg-gradient-primary text-white text-center py-4 border-0">
              <div className="mb-3">
                <i className="fas fa-lock fa-3x mb-3"></i>
                <h4 className="mb-2 fw-bold">Welcome Back</h4>
                <small className="opacity-75">Sign in to your LUCT account</small>
              </div>
            </div>
            
            <div className="card-body p-4 p-md-5">
              {error && (
                <div className="alert alert-danger d-flex align-items-center rounded-3" role="alert">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  <div>{error}</div>
                </div>
              )}

              <form onSubmit={submit} className="needs-validation" noValidate>
                <div className="mb-4">
                  <label className="form-label fw-semibold text-dark">Email Address</label>
                  <div className="input-group input-group-lg">
                    <span className="input-group-text bg-light border-end-0">
                      <i className="fas fa-envelope text-muted"></i>
                    </span>
                    <input 
                      type="email" 
                      className="form-control border-start-0" 
                      value={email} 
                      onChange={e => setEmail(e.target.value)} 
                      required 
                      placeholder="Enter your email"
                      disabled={loading}
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="form-label fw-semibold text-dark">Password</label>
                  <div className="input-group input-group-lg">
                    <span className="input-group-text bg-light border-end-0">
                      <i className="fas fa-lock text-muted"></i>
                    </span>
                    <input 
                      type="password" 
                      className="form-control border-start-0" 
                      value={password} 
                      onChange={e => setPassword(e.target.value)} 
                      required 
                      placeholder="Enter your password"
                      disabled={loading}
                    />
                  </div>
                </div>

                <button 
                  className="btn btn-primary btn-lg w-100 py-3 fw-semibold rounded-pill shadow-sm" 
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Signing in...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-sign-in-alt me-2"></i>
                      Sign In
                    </>
                  )}
                </button>
              </form>

              <div className="text-center mt-4 pt-3 border-top">
                <p className="text-muted mb-2">
                  Don't have an account?{' '}
                  <Link to="/register" className="text-primary text-decoration-none fw-semibold">
                    Create one here
                  </Link>
                </p>
                <small className="text-muted">
                  <Link to="/forgot-password" className="text-decoration-none">
                    Forgot your password?
                  </Link>
                </small>
              </div>
            </div>
          </div>

          {/* Demo Credentials Card */}
          <div className="card mt-4 border-0 rounded-4 bg-info bg-opacity-10">
            <div className="card-body p-3">
              <small className="text-info">
                <i className="fas fa-info-circle me-1"></i>
                <strong>Demo Access:</strong> Use lecturer credentials from the database
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
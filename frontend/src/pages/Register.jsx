import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../utils/auth';
import { api, API_ENDPOINTS } from '../utils/api';

export default function Register() {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Lecturer'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  
  const navigate = useNavigate();
  const auth = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    
    // Clear errors when user starts typing
    if (error) setError('');
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};

    // Check required fields
    if (!form.first_name.trim()) {
      errors.first_name = 'First name is required';
    }

    if (!form.last_name.trim()) {
      errors.last_name = 'Last name is required';
    }

    if (!form.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!form.password) {
      errors.password = 'Password is required';
    } else if (form.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (!form.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (form.password !== form.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate form
    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const { confirmPassword, ...submitData } = form;
      const response = await api.post(API_ENDPOINTS.REGISTER, submitData);

      if (response.success) {
        // Auto-login after successful registration
        auth.saveLogin(response.data.token, response.data.user);
        navigate('/');
      } else {
        setError(response.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(
        err.message || 
        'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  const getFieldClass = (fieldName) => {
    return fieldErrors[fieldName] ? 'form-control is-invalid' : 'form-control';
  };

  return (
    <div className="container-fluid py-5 bg-light min-vh-100">
      <div className="row justify-content-center align-items-center min-vh-100">
        <div className="col-md-8 col-lg-6 col-xl-5">
          <div className="card shadow border-0 rounded-4 overflow-hidden">
            <div className="card-header bg-gradient-primary text-white text-center py-4 border-0">
              <div className="mb-3">
                <i className="fas fa-user-plus fa-3x mb-3"></i>
                <h4 className="mb-2 fw-bold">Join LUCT Reporting</h4>
                <small className="opacity-75">Create your account to start reporting</small>
              </div>
            </div>
            
            <div className="card-body p-4 p-md-5">
              {error && (
                <div className="alert alert-danger d-flex align-items-center rounded-3" role="alert">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  <div>{error}</div>
                </div>
              )}

              <form onSubmit={submit}>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold text-dark">
                      First Name <span className="text-danger">*</span>
                    </label>
                    <input 
                      type="text" 
                      className={getFieldClass('first_name')}
                      name="first_name"
                      value={form.first_name}
                      onChange={handleChange}
                      placeholder="Enter your first name"
                      disabled={loading}
                    />
                    {fieldErrors.first_name && (
                      <div className="invalid-feedback">{fieldErrors.first_name}</div>
                    )}
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold text-dark">
                      Last Name <span className="text-danger">*</span>
                    </label>
                    <input 
                      type="text" 
                      className={getFieldClass('last_name')}
                      name="last_name"
                      value={form.last_name}
                      onChange={handleChange}
                      placeholder="Enter your last name"
                      disabled={loading}
                    />
                    {fieldErrors.last_name && (
                      <div className="invalid-feedback">{fieldErrors.last_name}</div>
                    )}
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold text-dark">
                    Email Address <span className="text-danger">*</span>
                  </label>
                  <input 
                    type="email" 
                    className={getFieldClass('email')}
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Enter your email address"
                    disabled={loading}
                  />
                  {fieldErrors.email && (
                    <div className="invalid-feedback">{fieldErrors.email}</div>
                  )}
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold text-dark">
                      Password <span className="text-danger">*</span>
                    </label>
                    <input 
                      type="password" 
                      className={getFieldClass('password')}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Create a password"
                      disabled={loading}
                    />
                    {fieldErrors.password && (
                      <div className="invalid-feedback">{fieldErrors.password}</div>
                    )}
                    <div className="form-text">Must be at least 6 characters long</div>
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold text-dark">
                      Confirm Password <span className="text-danger">*</span>
                    </label>
                    <input 
                      type="password" 
                      className={getFieldClass('confirmPassword')}
                      name="confirmPassword"
                      value={form.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm your password"
                      disabled={loading}
                    />
                    {fieldErrors.confirmPassword && (
                      <div className="invalid-feedback">{fieldErrors.confirmPassword}</div>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label fw-semibold text-dark">
                    Role <span className="text-danger">*</span>
                  </label>
                  <select 
                    className="form-select" 
                    name="role"
                    value={form.role} 
                    onChange={handleChange}
                    disabled={loading}
                  >
                    <option value="Lecturer">Lecturer</option>
                    <option value="Student">Student</option>
                    <option value="PRL">PRL</option>
                    <option value="PL">PL</option>
                    <option value="Admin">Admin</option>
                  </select>
                  <div className="form-text">
                    Select your role in the institution. This determines your access level.
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
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-user-plus me-2"></i>
                      Create Account
                    </>
                  )}
                </button>
              </form>

              <div className="text-center mt-4 pt-3 border-top">
                <p className="text-muted mb-0">
                  Already have an account?{' '}
                  <Link to="/login" className="text-primary text-decoration-none fw-semibold">
                    Sign in here
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Role Information Card */}
          <div className="card mt-4 border-0 rounded-4 bg-light">
            <div className="card-body p-3">
              <small className="text-muted">
                <i className="fas fa-info-circle me-1"></i>
                <strong>Role Information:</strong> Lecturers can submit reports, Students can view reports, 
                PRL/PL/Admin have administrative access.
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
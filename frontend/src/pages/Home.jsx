import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/auth';
import { Link, useNavigate } from 'react-router-dom';
import { api, API_ENDPOINTS } from '../utils/api';

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentReports, setRecentReports] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, reportsRes] = await Promise.all([
        api.get(API_ENDPOINTS.REPORTS_STATS, true),
        api.get(API_ENDPOINTS.REPORTS, true)
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (reportsRes.success) setRecentReports(reportsRes.data || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const QuickActionCard = ({ icon, title, description, buttonText, link, variant = 'primary' }) => (
    <div className="col-md-6 col-lg-4 mb-4">
      <div className="card border-0 shadow-sm h-100 quick-action-card">
        <div className="card-body text-center p-4">
          <div className={`bg-${variant}-subtle rounded-circle d-inline-flex align-items-center justify-content-center mb-3`} 
               style={{ width: '80px', height: '80px' }}>
            <i className={`${icon} fa-2x text-${variant}`}></i>
          </div>
          <h5 className="card-title fw-bold text-dark">{title}</h5>
          <p className="card-text text-muted">{description}</p>
          <Link to={link} className={`btn btn-${variant} mt-3 px-4 rounded-pill`}>
            {buttonText}
          </Link>
        </div>
      </div>
    </div>
  );

  const StatCard = ({ icon, value, label, color = 'primary' }) => (
    <div className="col-6 col-md-3 mb-3">
      <div className={`card border-start border-${color} border-4 shadow-sm h-100`}>
        <div className="card-body py-3">
          <div className="row align-items-center">
            <div className="col">
              <div className={`text-xs fw-bold text-${color} text-uppercase mb-1`}>
                {label}
              </div>
              <div className="h5 mb-0 fw-bold text-gray-800">
                {value}
              </div>
            </div>
            <div className="col-auto">
              <i className={`${icon} fa-2x text-gray-300`}></i>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container-fluid py-4 home-container">
      {/* Hero Section */}
      <div className="row mb-5">
        <div className="col-12">
          <div className="jumbotron bg-gradient-primary text-white rounded-4 p-5">
            <div className="container-fluid py-2">
              <h1 className="display-5 fw-bold mb-3">
                Welcome to LUCT Reporting System
              </h1>
              <p className="lead mb-4 opacity-75">
                Streamlined lecture reporting and academic management platform for 
                {isAuthenticated ? ` ${user?.first_name} ${user?.last_name}` : ' Lecturers and Administrators'}
              </p>
              
              {!isAuthenticated && (
                <div className="d-flex gap-3 flex-wrap">
                  <Link to="/register" className="btn btn-light btn-lg px-4 rounded-pill fw-semibold">
                    Get Started
                  </Link>
                  <Link to="/login" className="btn btn-outline-light btn-lg px-4 rounded-pill">
                    Sign In
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isAuthenticated ? (
        <>
          {/* Welcome Section */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="alert alert-primary border-0 rounded-3">
                <div className="d-flex align-items-center">
                  <i className="fas fa-user-circle fa-2x me-3"></i>
                  <div>
                    <h5 className="alert-heading mb-1 fw-bold">
                      Welcome back, {user?.first_name} {user?.last_name}!
                    </h5>
                    <p className="mb-0">
                      You are logged in as <span className="badge bg-dark text-capitalize">{user?.role}</span>. 
                      {user?.role === 'Lecturer' 
                        ? ' Manage your lecture reports and track your teaching activities.'
                        : ' Monitor all system reports and institutional performance.'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          {stats && !loading && (
            <div className="row mb-5">
              <div className="col-12 mb-4">
                <h4 className="text-primary mb-3 fw-bold">📊 Quick Overview</h4>
              </div>
              
              <StatCard
                icon="fas fa-clipboard-list"
                value={stats.total_reports || 0}
                label="Total Reports"
                color="primary"
              />
              
              <StatCard
                icon="fas fa-users"
                value={`${Math.round(stats.avg_attendance) || 0}%`}
                label="Avg Attendance"
                color="success"
              />
              
              <StatCard
                icon="fas fa-chalkboard-teacher"
                value={stats.active_lecturers || 0}
                label="Active Lecturers"
                color="info"
              />
              
              <StatCard
                icon="fas fa-book"
                value={stats.courses_covered || 0}
                label="Courses Covered"
                color="warning"
              />
            </div>
          )}

          {/* Quick Actions */}
          <div className="row mb-5">
            <div className="col-12 mb-4">
              <h4 className="text-primary mb-3 fw-bold">🚀 Quick Actions</h4>
            </div>
            
            {user?.role === 'Lecturer' && (
              <QuickActionCard
                icon="fas fa-plus-circle"
                title="Submit New Report"
                description="Create and submit a new lecture report with detailed information about your class."
                buttonText="Start Reporting"
                link="/report"
                variant="primary"
              />
            )}
            
            <QuickActionCard
              icon="fas fa-chart-bar"
              title="View Reports"
              description="Access and analyze all submitted lecture reports and performance statistics."
              buttonText="View Dashboard"
              link="/reports"
              variant="success"
            />
            
            <QuickActionCard
              icon="fas fa-history"
              title="Report History"
              description="Review your previously submitted reports and track your reporting progress."
              buttonText="View History"
              link="/reports"
              variant="info"
            />
          </div>

          {/* Recent Reports Section */}
          {recentReports.length > 0 && (
            <div className="row">
              <div className="col-12">
                <div className="card shadow border-0">
                  <div className="card-header bg-white py-3 border-bottom">
                    <h5 className="mb-0 text-primary fw-bold">
                      <i className="fas fa-clock me-2"></i>
                      Recent Reports
                    </h5>
                  </div>
                  <div className="card-body">
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead className="table-light">
                          <tr>
                            <th>Report ID</th>
                            <th>Course</th>
                            <th>Date</th>
                            <th>Attendance</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentReports.slice(0, 5).map(report => {
                            const attendancePercent = report.actual_present && report.total_registered 
                              ? Math.round((report.actual_present / report.total_registered) * 100)
                              : 0;
                            
                            return (
                              <tr key={report.id} className="hover-pointer" 
                                  onClick={() => navigate('/reports')}>
                                <td>
                                  <strong className="text-primary">LR-{report.id.toString().padStart(6, '0')}</strong>
                                </td>
                                <td>
                                  <div>
                                    <strong>{report.course_name}</strong>
                                    <br />
                                    <small className="text-muted">{report.course_code}</small>
                                  </div>
                                </td>
                                <td>
                                  {new Date(report.lecture_date).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </td>
                                <td>
                                  <div className="d-flex align-items-center">
                                    <div className="progress flex-grow-1 me-2" style={{ height: '8px' }}>
                                      <div 
                                        className={`progress-bar ${attendancePercent >= 80 ? 'bg-success' : attendancePercent >= 60 ? 'bg-warning' : 'bg-danger'}`}
                                        style={{ width: `${attendancePercent}%` }}
                                      ></div>
                                    </div>
                                    <small className="fw-semibold">
                                      {attendancePercent}%
                                    </small>
                                  </div>
                                </td>
                                <td>
                                  <span className="badge bg-success rounded-pill">Submitted</span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="text-center mt-3">
                      <Link to="/reports" className="btn btn-outline-primary rounded-pill">
                        View All Reports
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="row">
              <div className="col-12 text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading dashboard...</span>
                </div>
                <p className="text-muted mt-2">Loading your dashboard...</p>
              </div>
            </div>
          )}

          {/* Empty State for Lecturers */}
          {!loading && recentReports.length === 0 && user?.role === 'Lecturer' && (
            <div className="row">
              <div className="col-12">
                <div className="card shadow border-0 text-center py-5">
                  <div className="card-body">
                    <i className="fas fa-clipboard-list fa-4x text-muted mb-3"></i>
                    <h4 className="text-muted">No Reports Yet</h4>
                    <p className="text-muted mb-4">You haven't submitted any lecture reports yet.</p>
                    <Link to="/report" className="btn btn-primary rounded-pill px-4">
                      <i className="fas fa-plus me-2"></i>
                      Create Your First Report
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Public Landing Page */
        <div className="row">
          {/* Features Section */}
          <div className="col-12 mb-5">
            <h3 className="text-center text-primary mb-4 fw-bold">Why Choose LUCT Reporting System?</h3>
            <div className="row g-4">
              <div className="col-md-4">
                <div className="text-center">
                  <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                       style={{ width: '100px', height: '100px' }}>
                    <i className="fas fa-bolt fa-3x text-primary"></i>
                  </div>
                  <h5 className="fw-bold text-dark">Fast & Efficient</h5>
                  <p className="text-muted">
                    Streamline your lecture reporting process with our intuitive and efficient platform.
                  </p>
                </div>
              </div>
              
              <div className="col-md-4">
                <div className="text-center">
                  <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                       style={{ width: '100px', height: '100px' }}>
                    <i className="fas fa-chart-line fa-3x text-success"></i>
                  </div>
                  <h5 className="fw-bold text-dark">Data Insights</h5>
                  <p className="text-muted">
                    Gain valuable insights from comprehensive analytics and reporting tools.
                  </p>
                </div>
              </div>
              
              <div className="col-md-4">
                <div className="text-center">
                  <div className="bg-info bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                       style={{ width: '100px', height: '100px' }}>
                    <i className="fas fa-shield-alt fa-3x text-info"></i>
                  </div>
                  <h5 className="fw-bold text-dark">Secure & Reliable</h5>
                  <p className="text-muted">
                    Your data is protected with enterprise-grade security and reliability features.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="col-12">
            <div className="card bg-gradient-primary text-white border-0 rounded-4 overflow-hidden">
              <div className="card-body text-center p-5">
                <h3 className="card-title mb-3 fw-bold">Ready to Get Started?</h3>
                <p className="card-text mb-4 opacity-75">
                  Join hundreds of educators using LUCT Reporting System to streamline their academic reporting.
                </p>
                <div className="d-flex gap-3 justify-content-center flex-wrap">
                  <Link to="/register" className="btn btn-light btn-lg px-4 rounded-pill fw-semibold">
                    Create Account
                  </Link>
                  <Link to="/login" className="btn btn-outline-light btn-lg px-4 rounded-pill">
                    Sign In
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer Section */}
      <div className="row mt-5">
        <div className="col-12">
          <div className="text-center text-muted py-4">
            <p className="mb-2 fw-semibold">
              LUCT Reporting System - Streamlining Academic Management
            </p>
            <p className="mb-0 small">
              © 2024 Limkokwing University of Creative Technology. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
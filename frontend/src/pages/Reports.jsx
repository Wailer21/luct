// Reports.jsx - Enhanced with Role-Based Content
import React, { useEffect, useState } from 'react';
import { useAuth } from '../utils/auth';
import { api, API_ENDPOINTS } from '../utils/api';

export default function Reports({ view = 'all' }) {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchReports();
    if (view === 'all') {
      fetchStats();
    }
  }, [filter, view]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      let endpoint = API_ENDPOINTS.REPORTS;
      
      const response = await api.get(endpoint, true);
      
      if (response.success) {
        let filteredReports = response.data || [];
        
        // Apply role-based filtering
        if (user?.role === 'Lecturer') {
          if (filter === 'my' || view === 'my-classes') {
            filteredReports = filteredReports.filter(report => report.lecturer_id === user.id);
          }
        } else if (user?.role === 'Student') {
          // Students see only reports relevant to their courses
          filteredReports = filteredReports.filter(report => 
            report.course_id === user.course_id // Assuming student has course_id
          );
        }
        
        setReports(filteredReports);
      }
    } catch (err) {
      setError(err.message || 'Failed to load reports');
      console.error('Fetch reports error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.REPORTS_STATS, true);
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Fetch stats error:', err);
    }
  };

  const getAttendancePercentage = (actual, total) => {
    if (!actual || !total) return 0;
    return Math.round((actual / total) * 100);
  };

  const getAttendanceColor = (percentage) => {
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'warning';
    return 'danger';
  };

  const getAttendanceVariant = (percentage) => {
    if (percentage >= 80) return 'bg-success';
    if (percentage >= 60) return 'bg-warning';
    return 'bg-danger';
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
  };

  // Role-based configuration
  const getRoleConfig = () => {
    const config = {
      Student: {
        title: '📈 Course Monitoring',
        description: 'Track your course progress and attendance',
        showFilters: false,
        showStats: false,
        columns: ['Report ID', 'Course', 'Lecture Date', 'Attendance', 'Week', 'Status']
      },
      Lecturer: {
        title: view === 'my-classes' ? '👨‍🏫 My Classes' : '📊 Lecture Reports',
        description: view === 'my-classes' ? 'Manage your assigned classes and reports' : 'Track and manage your lecture reports',
        showFilters: view !== 'my-classes',
        showStats: view !== 'my-classes',
        columns: ['Report ID', 'Course', 'Class', 'Lecture Date', 'Attendance', 'Week', 'Status']
      },
      PRL: {
        title: '📋 Faculty Reports',
        description: 'Overview of all reports in your faculty',
        showFilters: false,
        showStats: true,
        columns: ['Report ID', 'Course', 'Lecturer', 'Lecture Date', 'Attendance', 'Week', 'Status']
      },
      PL: {
        title: '📋 Program Reports',
        description: 'Monitor reports across your program',
        showFilters: false,
        showStats: true,
        columns: ['Report ID', 'Course', 'Lecturer', 'Lecture Date', 'Attendance', 'Week', 'Status']
      },
      Admin: {
        title: '📋 System Reports',
        description: 'Complete overview of all system reports',
        showFilters: false,
        showStats: true,
        columns: ['Report ID', 'Course', 'Lecturer', 'Faculty', 'Lecture Date', 'Attendance', 'Week', 'Status']
      }
    };
    return config[user?.role] || config.Lecturer;
  };

  const roleConfig = getRoleConfig();

  if (loading) {
    return (
      <div className="container-fluid">
        <div className="d-flex justify-content-center align-items-center py-5">
          <div className="text-center">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Loading reports...</span>
            </div>
            <p className="text-muted">Loading {roleConfig.title.toLowerCase()}...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* Header with Role-Based Content */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center flex-wrap">
            <div>
              <h4 className="text-primary mb-1 fw-bold">{roleConfig.title}</h4>
              <p className="text-muted mb-0">{roleConfig.description}</p>
            </div>
            
            {/* Role-Based Controls */}
            {roleConfig.showFilters && user?.role === 'Lecturer' && (
              <div className="btn-group btn-group-sm" role="group">
                <button
                  type="button"
                  className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline-primary'} rounded-pill`}
                  onClick={() => handleFilterChange('all')}
                >
                  All Reports
                </button>
                <button
                  type="button"
                  className={`btn ${filter === 'my' ? 'btn-primary' : 'btn-outline-primary'} rounded-pill`}
                  onClick={() => handleFilterChange('my')}
                >
                  My Reports
                </button>
              </div>
            )}

            {/* Student Progress Summary */}
            {user?.role === 'Student' && reports.length > 0 && (
              <div className="text-end">
                <div className="text-success fw-bold">
                  <i className="fas fa-chart-line me-1"></i>
                  Overall Progress
                </div>
                <small className="text-muted">
                  {reports.length} reports in your courses
                </small>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Role-Based Stats Overview */}
      {roleConfig.showStats && stats && (
        <div className="row mb-4">
          <div className="col-xl-3 col-md-6 mb-4">
            <div className="card border-start border-primary border-4 shadow-sm h-100">
              <div className="card-body">
                <div className="row align-items-center">
                  <div className="col">
                    <div className="text-xs fw-bold text-primary text-uppercase mb-1">
                      Total Reports
                    </div>
                    <div className="h5 mb-0 fw-bold text-gray-800">
                      {stats.total_reports}
                    </div>
                  </div>
                  <div className="col-auto">
                    <i className="fas fa-clipboard-list fa-2x text-gray-300"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-xl-3 col-md-6 mb-4">
            <div className="card border-start border-success border-4 shadow-sm h-100">
              <div className="card-body">
                <div className="row align-items-center">
                  <div className="col">
                    <div className="text-xs fw-bold text-success text-uppercase mb-1">
                      Avg Attendance
                    </div>
                    <div className="h5 mb-0 fw-bold text-gray-800">
                      {Math.round(stats.avg_attendance)}%
                    </div>
                  </div>
                  <div className="col-auto">
                    <i className="fas fa-users fa-2x text-gray-300"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-xl-3 col-md-6 mb-4">
            <div className="card border-start border-info border-4 shadow-sm h-100">
              <div className="card-body">
                <div className="row align-items-center">
                  <div className="col">
                    <div className="text-xs fw-bold text-info text-uppercase mb-1">
                      {user?.role === 'Lecturer' ? 'My Reports' : 'Active Lecturers'}
                    </div>
                    <div className="h5 mb-0 fw-bold text-gray-800">
                      {user?.role === 'Lecturer' ? 
                        reports.filter(r => r.lecturer_id === user.id).length : 
                        stats.active_lecturers
                      }
                    </div>
                  </div>
                  <div className="col-auto">
                    <i className="fas fa-chalkboard-teacher fa-2x text-gray-300"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-xl-3 col-md-6 mb-4">
            <div className="card border-start border-warning border-4 shadow-sm h-100">
              <div className="card-body">
                <div className="row align-items-center">
                  <div className="col">
                    <div className="text-xs fw-bold text-warning text-uppercase mb-1">
                      Courses Covered
                    </div>
                    <div className="h5 mb-0 fw-bold text-gray-800">
                      {stats.courses_covered}
                    </div>
                  </div>
                  <div className="col-auto">
                    <i className="fas fa-book fa-2x text-gray-300"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reports Table */}
      <div className="card shadow border-0 rounded-4 overflow-hidden">
        <div className="card-header bg-white py-3 border-bottom">
          <div className="d-flex justify-content-between align-items-center">
            <h6 className="m-0 fw-bold text-primary">
              <i className="fas fa-list me-2"></i>
              {filter === 'my' ? 'My Lecture Reports' : roleConfig.title}
            </h6>
            <span className="badge bg-primary rounded-pill">
              {reports.length} {reports.length === 1 ? 'Report' : 'Reports'}
            </span>
          </div>
        </div>
        
        <div className="card-body">
          {error && (
            <div className="alert alert-danger d-flex align-items-center rounded-3" role="alert">
              <i className="fas fa-exclamation-triangle me-2"></i>
              <div>{error}</div>
            </div>
          )}

          {reports.length === 0 ? (
            <div className="text-center py-5">
              <i className="fas fa-clipboard-list fa-4x text-muted mb-3"></i>
              <h5 className="text-muted fw-bold">No reports found</h5>
              <p className="text-muted mb-4">
                {user?.role === 'Lecturer' 
                  ? 'You haven\'t submitted any reports yet. Start by creating your first report!' 
                  : user?.role === 'Student'
                  ? 'No reports available for your courses yet.'
                  : 'No reports have been submitted to the system yet.'
                }
              </p>
              {user?.role === 'Lecturer' && (
                <a href="/report" className="btn btn-primary rounded-pill px-4">
                  <i className="fas fa-plus me-2"></i>
                  Create First Report
                </a>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    {roleConfig.columns.includes('Report ID') && <th>Report ID</th>}
                    {roleConfig.columns.includes('Course') && <th>Course</th>}
                    {roleConfig.columns.includes('Class') && <th>Class</th>}
                    {roleConfig.columns.includes('Lecturer') && <th>Lecturer</th>}
                    {roleConfig.columns.includes('Faculty') && <th>Faculty</th>}
                    {roleConfig.columns.includes('Lecture Date') && <th>Lecture Date</th>}
                    {roleConfig.columns.includes('Attendance') && <th>Attendance</th>}
                    {roleConfig.columns.includes('Week') && <th>Week</th>}
                    {roleConfig.columns.includes('Status') && <th>Status</th>}
                  </tr>
                </thead>
                <tbody>
                  {reports.map(report => {
                    const attendancePercent = getAttendancePercentage(
                      report.actual_present, 
                      report.total_registered
                    );
                    const attendanceColor = getAttendanceColor(attendancePercent);
                    const attendanceVariant = getAttendanceVariant(attendancePercent);

                    return (
                      <tr key={report.id} className="hover-pointer">
                        {roleConfig.columns.includes('Report ID') && (
                          <td>
                            <strong className="text-primary">LR-{report.id.toString().padStart(6, '0')}</strong>
                          </td>
                        )}
                        {roleConfig.columns.includes('Course') && (
                          <td>
                            <div>
                              <strong className="text-dark">{report.course_name}</strong>
                              <br />
                              <small className="text-muted">{report.course_code}</small>
                            </div>
                          </td>
                        )}
                        {roleConfig.columns.includes('Class') && (
                          <td>
                            <span className="fw-semibold">{report.class_name}</span>
                          </td>
                        )}
                        {roleConfig.columns.includes('Lecturer') && (
                          <td>
                            <div className="d-flex align-items-center">
                              <i className="fas fa-user-circle text-muted me-2"></i>
                              <span>{report.lecturer_name}</span>
                            </div>
                          </td>
                        )}
                        {roleConfig.columns.includes('Faculty') && (
                          <td>
                            <span className="badge bg-secondary">{report.faculty_name}</span>
                          </td>
                        )}
                        {roleConfig.columns.includes('Lecture Date') && (
                          <td>
                            <div className="text-nowrap">
                              {new Date(report.lecture_date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </div>
                          </td>
                        )}
                        {roleConfig.columns.includes('Attendance') && (
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="progress flex-grow-1 me-2" style={{ height: '8px' }}>
                                <div 
                                  className={`progress-bar ${attendanceVariant}`}
                                  style={{ width: `${attendancePercent}%` }}
                                ></div>
                              </div>
                              <div className="text-nowrap">
                                <small className="fw-semibold">
                                  {report.actual_present || 0}/{report.total_registered || 0}
                                </small>
                                <br />
                                <small className={`text-${attendanceColor} fw-bold`}>
                                  {attendancePercent}%
                                </small>
                              </div>
                            </div>
                          </td>
                        )}
                        {roleConfig.columns.includes('Week') && (
                          <td>
                            <span className="badge bg-secondary rounded-pill">
                              Week {report.week_of_reporting}
                            </span>
                          </td>
                        )}
                        {roleConfig.columns.includes('Status') && (
                          <td>
                            <span className="badge bg-success rounded-pill">
                              <i className="fas fa-check me-1"></i>
                              Submitted
                            </span>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Student-Specific Progress Section */}
      {user?.role === 'Student' && reports.length > 0 && (
        <div className="row mt-4">
          <div className="col-12">
            <div className="card border-0 bg-light">
              <div className="card-body">
                <h6 className="text-primary mb-3">
                  <i className="fas fa-chart-line me-2"></i>
                  Your Learning Progress
                </h6>
                <div className="row text-center">
                  <div className="col-md-4">
                    <div className="text-success fw-bold fs-4">
                      {reports.length}
                    </div>
                    <small className="text-muted">Total Sessions</small>
                  </div>
                  <div className="col-md-4">
                    <div className="text-info fw-bold fs-4">
                      {Math.round(reports.reduce((acc, report) => acc + (report.actual_present / report.total_registered), 0) / reports.length * 100)}%
                    </div>
                    <small className="text-muted">Avg Attendance</small>
                  </div>
                  <div className="col-md-4">
                    <div className="text-warning fw-bold fs-4">
                      {new Set(reports.map(r => r.course_id)).size}
                    </div>
                    <small className="text-muted">Courses</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
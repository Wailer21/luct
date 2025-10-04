import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/auth';
import { apiMethods } from '../utils/api';
import { exportReportsToExcel } from '../utils/excelExport';

export default function Reports({ view = 'all' }) {
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState({
    course: '',
    lecturer: '',
    week: ''
  });

  const { user } = useAuth();

  useEffect(() => {
    fetchReports();
    if (view === 'all') {
      fetchStats();
    }
  }, [view]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await apiMethods.getReports();
      if (response.success) {
        let filteredReports = response.data.reports || response.data;
        
        if (view === 'my-classes' && user?.role === 'Lecturer') {
          filteredReports = filteredReports.filter(report => 
            report.lecturer_id === user.id
          );
        }
        
        setReports(filteredReports);
      } else {
        setError(response.message || 'Failed to fetch reports');
      }
    } catch (err) {
      setError('An error occurred while fetching reports');
      console.error('Reports fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiMethods.getReportStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Stats fetch error:', err);
    }
  };

  const handleFilterChange = (e) => {
    setFilter({
      ...filter,
      [e.target.name]: e.target.value
    });
  };

  const filteredReports = reports.filter(report => {
    return (
      (filter.course === '' || report.course_name?.toLowerCase().includes(filter.course.toLowerCase())) &&
      (filter.lecturer === '' || report.lecturer_name?.toLowerCase().includes(filter.lecturer.toLowerCase())) &&
      (filter.week === '' || report.week_of_reporting?.toString() === filter.week)
    );
  });

  const getAttendanceRate = (present, total) => {
    if (!total || total === 0) return 0;
    return Math.round((present / total) * 100);
  };

  const handleExport = () => {
    const success = exportReportsToExcel(filteredReports);
    if (success) {
      // You can add a toast notification here
      console.log('Export successful');
    }
  };

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="row">
          <div className="col-12 text-center">
            <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }}></div>
            <p className="mt-2">Loading reports...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="text-primary mb-1">
                <i className="fas fa-clipboard-list me-2"></i>
                {view === 'my-classes' ? 'My Class Reports' : 'Lecture Reports'}
              </h2>
              <p className="text-muted mb-0">
                {view === 'my-classes' 
                  ? 'Reports for your assigned classes' 
                  : 'All submitted lecture reports'
                }
              </p>
            </div>
            <div className="d-flex gap-2">
              {user?.role === 'Lecturer' && view !== 'my-classes' && (
                <a href="/report" className="btn btn-primary">
                  <i className="fas fa-plus-circle me-2"></i>
                  New Report
                </a>
              )}
              <button 
                className="btn btn-success"
                onClick={handleExport}
                disabled={filteredReports.length === 0}
              >
                <i className="fas fa-file-excel me-2"></i>
                Export to Excel
              </button>
            </div>
          </div>

          {stats && view === 'all' && (
            <div className="row mb-4">
              <div className="col-md-3 mb-3">
                <div className="card border-left-primary shadow h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between">
                      <div>
                        <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                          Total Reports
                        </div>
                        <div className="h5 mb-0 font-weight-bold text-gray-800">
                          {stats.total_reports || 0}
                        </div>
                      </div>
                      <i className="fas fa-clipboard-list fa-2x text-gray-300"></i>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-3 mb-3">
                <div className="card border-left-success shadow h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between">
                      <div>
                        <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                          Avg Attendance
                        </div>
                        <div className="h5 mb-0 font-weight-bold text-gray-800">
                          {stats.avg_attendance ? `${Math.round(stats.avg_attendance)}%` : '0%'}
                        </div>
                      </div>
                      <i className="fas fa-users fa-2x text-gray-300"></i>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-3 mb-3">
                <div className="card border-left-info shadow h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between">
                      <div>
                        <div className="text-xs font-weight-bold text-info text-uppercase mb-1">
                          Active Lecturers
                        </div>
                        <div className="h5 mb-0 font-weight-bold text-gray-800">
                          {stats.active_lecturers || 0}
                        </div>
                      </div>
                      <i className="fas fa-chalkboard-teacher fa-2x text-gray-300"></i>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-3 mb-3">
                <div className="card border-left-warning shadow h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between">
                      <div>
                        <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">
                          Courses Covered
                        </div>
                        <div className="h5 mb-0 font-weight-bold text-gray-800">
                          {stats.courses_covered || 0}
                        </div>
                      </div>
                      <i className="fas fa-book fa-2x text-gray-300"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="alert alert-danger" role="alert">
              <i className="fas fa-exclamation-circle me-2"></i>
              {error}
            </div>
          )}

          <div className="card shadow">
            <div className="card-header bg-white">
              <div className="row">
                <div className="col-md-4 mb-2">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Filter by course..."
                    name="course"
                    value={filter.course}
                    onChange={handleFilterChange}
                  />
                </div>
                <div className="col-md-4 mb-2">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Filter by lecturer..."
                    name="lecturer"
                    value={filter.lecturer}
                    onChange={handleFilterChange}
                  />
                </div>
                <div className="col-md-4 mb-2">
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Filter by week..."
                    name="week"
                    value={filter.week}
                    onChange={handleFilterChange}
                    min="1"
                    max="52"
                  />
                </div>
              </div>
            </div>
            <div className="card-body">
              {filteredReports.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-clipboard-list fa-3x text-muted mb-3"></i>
                  <h5 className="text-muted">No reports found</h5>
                  <p className="text-muted">
                    {filter.course || filter.lecturer || filter.week 
                      ? 'Try adjusting your filters' 
                      : 'No reports have been submitted yet'
                    }
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Course</th>
                        <th>Lecturer</th>
                        <th>Week</th>
                        <th>Date</th>
                        <th>Attendance</th>
                        <th>Topic</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReports.map((report) => (
                        <tr key={report.id}>
                          <td>
                            <strong>{report.course_code}</strong>
                            <br />
                            <small className="text-muted">{report.course_name}</small>
                          </td>
                          <td>{report.lecturer_name}</td>
                          <td>
                            <span className="badge bg-primary">Week {report.week_of_reporting}</span>
                          </td>
                          <td>
                            {new Date(report.lecture_date).toLocaleDateString()}
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="progress flex-grow-1 me-2" style={{ height: '6px' }}>
                                <div
                                  className={`progress-bar ${
                                    getAttendanceRate(report.actual_present, report.total_registered) >= 80
                                      ? 'bg-success'
                                      : getAttendanceRate(report.actual_present, report.total_registered) >= 60
                                      ? 'bg-warning'
                                      : 'bg-danger'
                                  }`}
                                  style={{
                                    width: `${getAttendanceRate(report.actual_present, report.total_registered)}%`
                                  }}
                                ></div>
                              </div>
                              <small>
                                {getAttendanceRate(report.actual_present, report.total_registered)}%
                              </small>
                            </div>
                            <small className="text-muted">
                              {report.actual_present}/{report.total_registered}
                            </small>
                          </td>
                          <td>
                            {report.topic || (
                              <span className="text-muted">No topic specified</span>
                            )}
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => {/* Add view details functionality */}}
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
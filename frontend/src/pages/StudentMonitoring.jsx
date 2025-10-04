import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/auth';
import { apiMethods } from '../utils/api';

export default function StudentMonitoring() {
  const [stats, setStats] = useState(null);
  const [performance, setPerformance] = useState([]);
  const [timeRange, setTimeRange] = useState('current_semester');
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const fetchData = async () => {
    try {
      const [statsRes, performanceRes] = await Promise.all([
        apiMethods.getStudentStats({ time_range: timeRange }),
        apiMethods.getStudentPerformance()
      ]);

      if (statsRes.success) setStats(statsRes.data.overview);
      if (performanceRes.success) setPerformance(performanceRes.data);
    } catch (error) {
      console.error('Error fetching student data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'Student') {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-danger">
          <i className="fas fa-exclamation-triangle me-2"></i>
          Access denied. Student monitoring is for students only.
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
                <i className="fas fa-chart-line me-2"></i>
                My Academic Progress
              </h2>
              <p className="text-muted mb-0">Track your attendance and performance</p>
            </div>
            <select
              className="form-select w-auto"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value="current_semester">Current Semester</option>
              <option value="last_30_days">Last 30 Days</option>
              <option value="last_7_days">Last 7 Days</option>
            </select>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }}></div>
              <p className="mt-2">Loading your progress...</p>
            </div>
          ) : (
            <>
              {/* Stats Overview */}
              {stats && (
                <div className="row mb-4">
                  <div className="col-md-3 mb-3">
                    <div className="card border-left-primary shadow h-100">
                      <div className="card-body">
                        <div className="d-flex justify-content-between">
                          <div>
                            <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                              Total Classes
                            </div>
                            <div className="h5 mb-0 font-weight-bold text-gray-800">
                              {stats.total_classes}
                            </div>
                          </div>
                          <i className="fas fa-calendar-check fa-2x text-gray-300"></i>
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
                              Attended Classes
                            </div>
                            <div className="h5 mb-0 font-weight-bold text-gray-800">
                              {stats.attended_classes}
                            </div>
                          </div>
                          <i className="fas fa-user-check fa-2x text-gray-300"></i>
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
                              Missed Classes
                            </div>
                            <div className="h5 mb-0 font-weight-bold text-gray-800">
                              {stats.missed_classes}
                            </div>
                          </div>
                          <i className="fas fa-user-times fa-2x text-gray-300"></i>
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
                              Attendance Rate
                            </div>
                            <div className="h5 mb-0 font-weight-bold text-gray-800">
                              {stats.attendance_rate}%
                            </div>
                          </div>
                          <i className="fas fa-percentage fa-2x text-gray-300"></i>
                        </div>
                        <div className="mt-2">
                          <div className="progress" style={{ height: '6px' }}>
                            <div
                              className={`progress-bar ${
                                stats.attendance_rate >= 80 ? 'bg-success' :
                                stats.attendance_rate >= 60 ? 'bg-warning' : 'bg-danger'
                              }`}
                              style={{ width: `${stats.attendance_rate}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Course Performance */}
              <div className="row">
                <div className="col-12">
                  <div className="card shadow">
                    <div className="card-header bg-white">
                      <h5 className="mb-0">
                        <i className="fas fa-book me-2"></i>
                        Course Performance
                      </h5>
                    </div>
                    <div className="card-body">
                      {performance.length === 0 ? (
                        <div className="text-center py-5">
                          <i className="fas fa-book-open fa-3x text-muted mb-3"></i>
                          <h5 className="text-muted">No course data available</h5>
                          <p className="text-muted">Your course performance will appear here</p>
                        </div>
                      ) : (
                        <div className="table-responsive">
                          <table className="table table-hover">
                            <thead>
                              <tr>
                                <th>Course</th>
                                <th>Classes</th>
                                <th>Attendance Rate</th>
                                <th>Performance Score</th>
                                <th>Grade</th>
                              </tr>
                            </thead>
                            <tbody>
                              {performance.map((course) => (
                                <tr key={course.course_id}>
                                  <td>
                                    <strong>{course.course_code}</strong>
                                    <br />
                                    <small className="text-muted">{course.course_name}</small>
                                  </td>
                                  <td>
                                    <span className="badge bg-primary">
                                      {course.attended_classes}/{course.total_classes}
                                    </span>
                                  </td>
                                  <td>
                                    <div className="d-flex align-items-center">
                                      <div className="progress flex-grow-1 me-2" style={{ height: '6px' }}>
                                        <div
                                          className={`progress-bar ${
                                            course.attendance_rate >= 80 ? 'bg-success' :
                                            course.attendance_rate >= 60 ? 'bg-warning' : 'bg-danger'
                                          }`}
                                          style={{ width: `${course.attendance_rate}%` }}
                                        ></div>
                                      </div>
                                      <small>{course.attendance_rate}%</small>
                                    </div>
                                  </td>
                                  <td>
                                    <div className="d-flex align-items-center">
                                      {[1, 2, 3, 4, 5].map(star => (
                                        <i
                                          key={star}
                                          className={`fas fa-star ${
                                            star <= course.performance_score ? 'text-warning' : 'text-muted'
                                          }`}
                                        ></i>
                                      ))}
                                      <span className="ms-1 fw-bold">
                                        {course.performance_score}/5
                                      </span>
                                    </div>
                                  </td>
                                  <td>
                                    <span className={`badge ${
                                      course.grade === 'A' ? 'bg-success' :
                                      course.grade === 'B' ? 'bg-primary' :
                                      course.grade === 'C' ? 'bg-info' :
                                      course.grade === 'D' ? 'bg-warning' : 'bg-danger'
                                    }`}>
                                      {course.grade}
                                    </span>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
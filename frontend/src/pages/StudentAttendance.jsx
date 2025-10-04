import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/auth';
import { apiMethods } from '../utils/api';
import { exportStudentAttendanceToExcel } from '../utils/excelExport';

export default function StudentAttendance() {
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState(null);
  const [timeRange, setTimeRange] = useState('current_semester');
  const [courseFilter, setCourseFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();

  useEffect(() => {
    fetchAttendance();
  }, [timeRange, courseFilter]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const response = await apiMethods.getStudentAttendance({
        time_range: timeRange,
        course_id: courseFilter || undefined
      });

      if (response.success) {
        setAttendance(response.data.reports);
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const success = exportStudentAttendanceToExcel(attendance, user?.first_name);
    if (success) {
      console.log('Attendance exported successfully');
    }
  };

  const getStatusBadge = (present) => {
    return present > 0 ? 
      <span className="badge bg-success">Present</span> : 
      <span className="badge bg-danger">Absent</span>;
  };

  if (user?.role !== 'Student') {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-danger">
          <i className="fas fa-exclamation-triangle me-2"></i>
          Access denied. Student attendance is for students only.
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="text-primary mb-0">
              <i className="fas fa-calendar-check me-2"></i>
              My Attendance Records
            </h2>
            <button
              className="btn btn-success"
              onClick={handleExport}
              disabled={attendance.length === 0}
            >
              <i className="fas fa-file-excel me-2"></i>
              Export Attendance
            </button>
          </div>

          {/* Filters */}
          <div className="card shadow mb-4">
            <div className="card-body">
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Time Range:</label>
                  <select
                    className="form-select"
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                  >
                    <option value="current_semester">Current Semester</option>
                    <option value="last_30_days">Last 30 Days</option>
                    <option value="last_7_days">Last 7 Days</option>
                  </select>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Filter by Course:</label>
                  <select
                    className="form-select"
                    value={courseFilter}
                    onChange={(e) => setCourseFilter(e.target.value)}
                  >
                    <option value="">All Courses</option>
                    {/* Course options would be populated from API */}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }}></div>
              <p className="mt-2">Loading attendance records...</p>
            </div>
          ) : (
            <>
              {/* Stats Summary */}
              {stats && (
                <div className="row mb-4">
                  <div className="col-md-4 mb-3">
                    <div className="card bg-primary text-white">
                      <div className="card-body text-center">
                        <h3>{stats.totalClasses}</h3>
                        <p className="mb-0">Total Classes</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4 mb-3">
                    <div className="card bg-success text-white">
                      <div className="card-body text-center">
                        <h3>{stats.attendedClasses}</h3>
                        <p className="mb-0">Classes Attended</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4 mb-3">
                    <div className="card bg-info text-white">
                      <div className="card-body text-center">
                        <h3>{stats.attendanceRate}%</h3>
                        <p className="mb-0">Attendance Rate</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Attendance Records */}
              <div className="card shadow">
                <div className="card-header bg-white">
                  <h5 className="mb-0">Attendance History</h5>
                </div>
                <div className="card-body">
                  {attendance.length === 0 ? (
                    <div className="text-center py-5">
                      <i className="fas fa-calendar-times fa-3x text-muted mb-3"></i>
                      <h5 className="text-muted">No attendance records found</h5>
                      <p className="text-muted">
                        {courseFilter ? 'Try changing your filters' : 'No classes attended in this period'}
                      </p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Course</th>
                            <th>Lecturer</th>
                            <th>Class</th>
                            <th>Topic</th>
                            <th>Status</th>
                            <th>Attendance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {attendance.map((record) => (
                            <tr key={record.id}>
                              <td>
                                {new Date(record.lecture_date).toLocaleDateString()}
                                <br />
                                <small className="text-muted">
                                  Week {record.week_of_reporting}
                                </small>
                              </td>
                              <td>
                                <strong>{record.course_code}</strong>
                                <br />
                                <small className="text-muted">{record.course_name}</small>
                              </td>
                              <td>{record.lecturer_name}</td>
                              <td>{record.class_name}</td>
                              <td>
                                {record.topic || (
                                  <span className="text-muted">No topic</span>
                                )}
                              </td>
                              <td>
                                {getStatusBadge(record.actual_present)}
                              </td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <div className="progress flex-grow-1 me-2" style={{ height: '6px' }}>
                                    <div
                                      className="progress-bar bg-success"
                                      style={{
                                        width: `${Math.round((record.actual_present / record.total_registered) * 100)}%`
                                      }}
                                    ></div>
                                  </div>
                                  <small>
                                    {record.actual_present}/{record.total_registered}
                                  </small>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
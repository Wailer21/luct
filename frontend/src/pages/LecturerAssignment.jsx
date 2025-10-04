import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/auth';
import { apiMethods } from '../utils/api';
import { exportReportsToExcel } from '../utils/excelExport';

export default function LecturerAssignment() {
  const [assignments, setAssignments] = useState([]);
  const [myClasses, setMyClasses] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('assignments');

  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [classesRes, reportsRes, statsRes] = await Promise.all([
        apiMethods.getMyClasses(),
        apiMethods.getReports(),
        apiMethods.getReportStats()
      ]);

      if (classesRes.success) {
        setMyClasses(classesRes.data);
        // For demo purposes, we'll create some assignment data
        // In a real app, this would come from an assignments API
        const demoAssignments = classesRes.data.map((classItem, index) => ({
          id: index + 1,
          class_name: classItem.class_name,
          course_name: classItem.course_name,
          course_code: classItem.course_code,
          assigned_date: new Date(Date.now() - index * 86400000).toISOString().split('T')[0],
          students_count: Math.floor(Math.random() * 50) + 20,
          status: ['Active', 'Completed', 'Upcoming'][index % 3],
          venue: classItem.venue,
          scheduled_time: classItem.scheduled_time
        }));
        setAssignments(demoAssignments);
      }

      if (statsRes.success) setStats(statsRes.data);
    } catch (err) {
      setError('Failed to fetch assignment data');
      console.error('Assignment fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportAssignments = () => {
    const exportData = assignments.map(assignment => ({
      'Class Name': assignment.class_name,
      'Course Code': assignment.course_code,
      'Course Name': assignment.course_name,
      'Assigned Date': new Date(assignment.assigned_date).toLocaleDateString(),
      'Students Count': assignment.students_count,
      'Status': assignment.status,
      'Venue': assignment.venue || 'N/A',
      'Scheduled Time': assignment.scheduled_time || 'N/A'
    }));

    // Using the existing export function with custom data
    const success = exportReportsToExcel(exportData);
    if (success) {
      console.log('Assignments exported successfully');
    }
  };

  const handleExportClassReports = () => {
    // Export reports for the lecturer's classes
    const classReports = myClasses.flatMap(classItem => 
      // This would be filtered reports for each class in a real app
      [{
        class_name: classItem.class_name,
        course_name: classItem.course_name,
        total_students: classItem.total_registered || 0,
        completed_reports: Math.floor(Math.random() * 10),
        avg_attendance: Math.floor(Math.random() * 30) + 70
      }]
    );

    const success = exportReportsToExcel(classReports);
    if (success) {
      console.log('Class reports exported successfully');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'Active': 'bg-primary',
      'Completed': 'bg-success',
      'Upcoming': 'bg-warning'
    };
    return (
      <span className={`badge ${statusConfig[status] || 'bg-secondary'}`}>
        {status}
      </span>
    );
  };

  if (user?.role !== 'Lecturer') {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-danger">
          <i className="fas fa-exclamation-triangle me-2"></i>
          Access denied. Lecturer assignments are for lecturers only.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="row">
          <div className="col-12 text-center">
            <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }}></div>
            <p className="mt-2">Loading assignments...</p>
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
                <i className="fas fa-chalkboard-teacher me-2"></i>
                My Assignments & Classes
              </h2>
              <p className="text-muted mb-0">Manage your class assignments and teaching schedule</p>
            </div>
            <div className="d-flex gap-2">
              <button
                className="btn btn-success"
                onClick={handleExportAssignments}
                disabled={assignments.length === 0}
              >
                <i className="fas fa-file-excel me-2"></i>
                Export Assignments
              </button>
              <button
                className="btn btn-info"
                onClick={handleExportClassReports}
                disabled={myClasses.length === 0}
              >
                <i className="fas fa-file-excel me-2"></i>
                Export Class Reports
              </button>
            </div>
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">
              <i className="fas fa-exclamation-circle me-2"></i>
              {error}
            </div>
          )}

          {/* Stats Overview */}
          {stats && (
            <div className="row mb-4">
              <div className="col-md-3 mb-3">
                <div className="card border-left-primary shadow h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between">
                      <div>
                        <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                          My Classes
                        </div>
                        <div className="h5 mb-0 font-weight-bold text-gray-800">
                          {myClasses.length}
                        </div>
                      </div>
                      <i className="fas fa-chalkboard-teacher fa-2x text-gray-300"></i>
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
                          Active Assignments
                        </div>
                        <div className="h5 mb-0 font-weight-bold text-gray-800">
                          {assignments.filter(a => a.status === 'Active').length}
                        </div>
                      </div>
                      <i className="fas fa-tasks fa-2x text-gray-300"></i>
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
                          Total Students
                        </div>
                        <div className="h5 mb-0 font-weight-bold text-gray-800">
                          {assignments.reduce((sum, assignment) => sum + assignment.students_count, 0)}
                        </div>
                      </div>
                      <i className="fas fa-users fa-2x text-gray-300"></i>
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
                          Completion Rate
                        </div>
                        <div className="h5 mb-0 font-weight-bold text-gray-800">
                          {Math.round((assignments.filter(a => a.status === 'Completed').length / assignments.length) * 100)}%
                        </div>
                      </div>
                      <i className="fas fa-chart-line fa-2x text-gray-300"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="card shadow">
            <div className="card-header bg-white">
              <ul className="nav nav-tabs card-header-tabs">
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'assignments' ? 'active' : ''}`}
                    onClick={() => setActiveTab('assignments')}
                  >
                    <i className="fas fa-tasks me-2"></i>
                    My Assignments ({assignments.length})
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'classes' ? 'active' : ''}`}
                    onClick={() => setActiveTab('classes')}
                  >
                    <i className="fas fa-chalkboard me-2"></i>
                    My Classes ({myClasses.length})
                  </button>
                </li>
              </ul>
            </div>
            <div className="card-body">
              {activeTab === 'assignments' && (
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0">Teaching Assignments</h5>
                    <small className="text-muted">
                      Showing {assignments.length} assignments
                    </small>
                  </div>
                  
                  {assignments.length === 0 ? (
                    <div className="text-center py-5">
                      <i className="fas fa-tasks fa-3x text-muted mb-3"></i>
                      <h5 className="text-muted">No assignments found</h5>
                      <p className="text-muted">You don't have any teaching assignments yet</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Class</th>
                            <th>Course</th>
                            <th>Assigned Date</th>
                            <th>Students</th>
                            <th>Venue</th>
                            <th>Schedule</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {assignments.map((assignment) => (
                            <tr key={assignment.id}>
                              <td>
                                <strong>{assignment.class_name}</strong>
                              </td>
                              <td>
                                <div>
                                  <strong>{assignment.course_code}</strong>
                                  <br />
                                  <small className="text-muted">{assignment.course_name}</small>
                                </div>
                              </td>
                              <td>
                                {new Date(assignment.assigned_date).toLocaleDateString()}
                              </td>
                              <td>
                                <span className="badge bg-primary">
                                  {assignment.students_count} students
                                </span>
                              </td>
                              <td>
                                {assignment.venue || (
                                  <span className="text-muted">Not specified</span>
                                )}
                              </td>
                              <td>
                                {assignment.scheduled_time || (
                                  <span className="text-muted">Not scheduled</span>
                                )}
                              </td>
                              <td>
                                {getStatusBadge(assignment.status)}
                              </td>
                              <td>
                                <div className="btn-group">
                                  <button className="btn btn-sm btn-outline-primary">
                                    <i className="fas fa-eye"></i>
                                  </button>
                                  <button className="btn btn-sm btn-outline-success">
                                    <i className="fas fa-edit"></i>
                                  </button>
                                  {assignment.status === 'Active' && (
                                    <button className="btn btn-sm btn-outline-info">
                                      <i className="fas fa-file-alt"></i>
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'classes' && (
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0">My Classes</h5>
                    <small className="text-muted">
                      {myClasses.length} classes assigned to you
                    </small>
                  </div>
                  
                  {myClasses.length === 0 ? (
                    <div className="text-center py-5">
                      <i className="fas fa-chalkboard fa-3x text-muted mb-3"></i>
                      <h5 className="text-muted">No classes found</h5>
                      <p className="text-muted">You haven't been assigned to any classes yet</p>
                    </div>
                  ) : (
                    <div className="row">
                      {myClasses.map((classItem) => (
                        <div key={classItem.id} className="col-md-6 col-lg-4 mb-3">
                          <div className="card h-100">
                            <div className="card-header bg-light">
                              <h6 className="mb-0">{classItem.class_name}</h6>
                            </div>
                            <div className="card-body">
                              <div className="mb-2">
                                <strong>{classItem.course_code}</strong>
                                <br />
                                <small className="text-muted">{classItem.course_name}</small>
                              </div>
                              <div className="mb-2">
                                <small className="text-muted">
                                  <i className="fas fa-university me-1"></i>
                                  {classItem.faculty_name}
                                </small>
                              </div>
                              {classItem.venue && (
                                <div className="mb-2">
                                  <small className="text-muted">
                                    <i className="fas fa-map-marker-alt me-1"></i>
                                    {classItem.venue}
                                  </small>
                                </div>
                              )}
                              {classItem.scheduled_time && (
                                <div className="mb-2">
                                  <small className="text-muted">
                                    <i className="fas fa-clock me-1"></i>
                                    {classItem.scheduled_time}
                                  </small>
                                </div>
                              )}
                            </div>
                            <div className="card-footer bg-transparent">
                              <div className="d-flex justify-content-between">
                                <button className="btn btn-sm btn-primary">
                                  View Details
                                </button>
                                <button className="btn btn-sm btn-success">
                                  Submit Report
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
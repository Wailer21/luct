// PLCourses.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/auth';
import { apiMethods } from '../utils/api';

export default function PLCourses() {
  const [departmentCourses, setDepartmentCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('current');

  const { user } = useAuth();

  useEffect(() => {
    fetchDepartmentCourses();
  }, []);

  const fetchDepartmentCourses = async () => {
    try {
      // Simulated API call - replace with actual endpoint
      const response = await apiMethods.getDepartmentCourses(user.departmentId);
      if (response.success) {
        setDepartmentCourses(response.data);
      }
    } catch (error) {
      console.error('Error fetching department courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentCourses = departmentCourses.filter(course => course.status === 'active');
  const archivedCourses = departmentCourses.filter(course => course.status === 'archived');

  const CourseCard = ({ course }) => (
    <div className="col-md-6 col-lg-4 mb-4">
      <div className="card h-100 shadow-sm">
        <div className="card-header bg-light d-flex justify-content-between align-items-center">
          <strong className="text-primary">{course.code}</strong>
          <span className={`badge ${
            course.status === 'active' ? 'bg-success' : 'bg-secondary'
          }`}>
            {course.status}
          </span>
        </div>
        <div className="card-body">
          <h6 className="card-title">{course.course_name}</h6>
          <p className="card-text small text-muted">{course.description}</p>
          <div className="mt-3">
            <div className="d-flex justify-content-between text-sm">
              <span>
                <i className="fas fa-users me-1"></i>
                {course.enrolled_students || 0} enrolled
              </span>
              <span>
                <i className="fas fa-chalkboard-teacher me-1"></i>
                {course.instructors?.length || 0} instructors
              </span>
            </div>
          </div>
        </div>
        <div className="card-footer bg-transparent">
          <div className="btn-group w-100">
            <button className="btn btn-sm btn-outline-primary">
              <i className="fas fa-edit"></i>
            </button>
            <button className="btn btn-sm btn-outline-info">
              <i className="fas fa-chart-bar"></i>
            </button>
            <button className="btn btn-sm btn-outline-success">
              <i className="fas fa-users"></i>
            </button>
            <button className="btn btn-sm btn-outline-warning">
              <i className="fas fa-archive"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="text-primary mb-0">
              <i className="fas fa-book me-2"></i>
              Department Course Management
            </h2>
            <button className="btn btn-primary">
              <i className="fas fa-plus me-2"></i>
              Add New Course
            </button>
          </div>

          {/* Quick Stats */}
          <div className="row mb-4">
            <div className="col-md-3">
              <div className="card bg-primary text-white">
                <div className="card-body text-center">
                  <h3 className="mb-0">{currentCourses.length}</h3>
                  <p className="mb-0">Active Courses</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-success text-white">
                <div className="card-body text-center">
                  <h3 className="mb-0">
                    {currentCourses.reduce((sum, course) => sum + (course.enrolled_students || 0), 0)}
                  </h3>
                  <p className="mb-0">Total Enrollments</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-warning text-white">
                <div className="card-body text-center">
                  <h3 className="mb-0">
                    {new Set(currentCourses.flatMap(course => course.instructors || [])).size}
                  </h3>
                  <p className="mb-0">Active Instructors</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-info text-white">
                <div className="card-body text-center">
                  <h3 className="mb-0">{archivedCourses.length}</h3>
                  <p className="mb-0">Archived Courses</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="card shadow">
            <div className="card-header bg-light">
              <ul className="nav nav-tabs card-header-tabs">
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'current' ? 'active' : ''}`}
                    onClick={() => setActiveTab('current')}
                  >
                    <i className="fas fa-play-circle me-2"></i>
                    Current Courses ({currentCourses.length})
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'archived' ? 'active' : ''}`}
                    onClick={() => setActiveTab('archived')}
                  >
                    <i className="fas fa-archive me-2"></i>
                    Archived Courses ({archivedCourses.length})
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'analytics' ? 'active' : ''}`}
                    onClick={() => setActiveTab('analytics')}
                  >
                    <i className="fas fa-chart-bar me-2"></i>
                    Analytics
                  </button>
                </li>
              </ul>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary"></div>
                  <p className="mt-2">Loading department courses...</p>
                </div>
              ) : (
                <>
                  {activeTab === 'current' && (
                    <div className="row">
                      {currentCourses.length > 0 ? (
                        currentCourses.map(course => (
                          <CourseCard key={course.id} course={course} />
                        ))
                      ) : (
                        <div className="col-12 text-center py-5">
                          <i className="fas fa-book-open fa-3x text-muted mb-3"></i>
                          <h5 className="text-muted">No active courses</h5>
                          <p className="text-muted">Add new courses to get started</p>
                          <button className="btn btn-primary mt-2">
                            <i className="fas fa-plus me-2"></i>
                            Create First Course
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'archived' && (
                    <div className="row">
                      {archivedCourses.length > 0 ? (
                        archivedCourses.map(course => (
                          <CourseCard key={course.id} course={course} />
                        ))
                      ) : (
                        <div className="col-12 text-center py-5">
                          <i className="fas fa-archive fa-3x text-muted mb-3"></i>
                          <h5 className="text-muted">No archived courses</h5>
                          <p className="text-muted">Archived courses will appear here</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'analytics' && (
                    <div className="row">
                      <div className="col-12">
                        <h5>Department Course Analytics</h5>
                        <p>Course performance metrics and enrollment trends will be displayed here.</p>
                        <div className="alert alert-info">
                          <i className="fas fa-info-circle me-2"></i>
                          Analytics dashboard is under development
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
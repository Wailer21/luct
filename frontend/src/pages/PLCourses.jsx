// PRLCourses.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/auth';
import { apiMethods } from '../utils/api';

export default function PRLCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [sortBy, setSortBy] = useState('code');

  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const coursesRes = await apiMethods.getCourses();
      if (coursesRes.success) setCourses(coursesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses
    .filter(course => 
      course.code.toLowerCase().includes(filter.toLowerCase()) ||
      course.course_name.toLowerCase().includes(filter.toLowerCase()) ||
      course.faculty_name.toLowerCase().includes(filter.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.course_name.localeCompare(b.course_name);
        case 'faculty':
          return a.faculty_name.localeCompare(b.faculty_name);
        case 'registrations':
          return (b.total_registered || 0) - (a.total_registered || 0);
        default:
          return a.code.localeCompare(b.code);
      }
    });

  const exportToCSV = () => {
    const headers = ['Course Code', 'Course Name', 'Faculty', 'Total Registered'];
    const csvContent = [
      headers.join(','),
      ...filteredCourses.map(course => 
        [`"${course.code}"`, `"${course.course_name}"`, `"${course.faculty_name}"`, course.total_registered || 0].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'courses_export.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="text-primary mb-0">
              <i className="fas fa-book me-2"></i>
              Course Management
            </h2>
            <button className="btn btn-success" onClick={exportToCSV}>
              <i className="fas fa-download me-2"></i>
              Export CSV
            </button>
          </div>

          {/* Filters and Controls */}
          <div className="card shadow mb-4">
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Search Courses</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by code, name, or faculty..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Sort By</label>
                  <select 
                    className="form-select" 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="code">Course Code</option>
                    <option value="name">Course Name</option>
                    <option value="faculty">Faculty</option>
                    <option value="registrations">Registrations</option>
                  </select>
                </div>
                <div className="col-md-2">
                  <label className="form-label">&nbsp;</label>
                  <div>
                    <span className="badge bg-primary">
                      {filteredCourses.length} courses
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Courses Table */}
          <div className="card shadow">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="fas fa-list me-2"></i>
                Available Courses
              </h5>
              <span className="badge bg-light text-primary">
                Total: {courses.length}
              </span>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary"></div>
                  <p className="mt-2">Loading courses...</p>
                </div>
              ) : filteredCourses.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-search fa-3x text-muted mb-3"></i>
                  <h5 className="text-muted">No courses found</h5>
                  <p className="text-muted">
                    {filter ? 'Try adjusting your search filter' : 'No courses available in the system'}
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-striped table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>Course Code</th>
                        <th>Course Name</th>
                        <th>Faculty</th>
                        <th>Total Registered</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCourses.map((course) => (
                        <tr key={course.id}>
                          <td>
                            <strong className="text-primary">{course.code}</strong>
                          </td>
                          <td>
                            <div>
                              <strong>{course.course_name}</strong>
                              {course.description && (
                                <small className="text-muted d-block mt-1">
                                  {course.description}
                                </small>
                              )}
                            </div>
                          </td>
                          <td>
                            <span className="badge bg-secondary">
                              {course.faculty_name}
                            </span>
                          </td>
                          <td>
                            <span className="badge bg-info fs-6">
                              {course.total_registered || 0}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${
                              (course.total_registered || 0) > 50 
                                ? 'bg-success' 
                                : (course.total_registered || 0) > 20 
                                ? 'bg-warning' 
                                : 'bg-danger'
                            }`}>
                              {(course.total_registered || 0) > 50 ? 'High' : 
                               (course.total_registered || 0) > 20 ? 'Medium' : 'Low'}
                            </span>
                          </td>
                          <td>
                            <button className="btn btn-sm btn-outline-primary">
                              <i className="fas fa-eye"></i>
                            </button>
                            <button className="btn btn-sm btn-outline-secondary ms-1">
                              <i className="fas fa-chart-bar"></i>
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

          {/* Statistics Summary */}
          <div className="row mt-4">
            <div className="col-md-3">
              <div className="card bg-primary text-white">
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <div>
                      <h4 className="mb-0">{courses.length}</h4>
                      <p className="mb-0">Total Courses</p>
                    </div>
                    <i className="fas fa-book fa-2x opacity-50"></i>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-success text-white">
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <div>
                      <h4 className="mb-0">
                        {courses.filter(c => (c.total_registered || 0) > 50).length}
                      </h4>
                      <p className="mb-0">High Demand</p>
                    </div>
                    <i className="fas fa-chart-line fa-2x opacity-50"></i>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-warning text-white">
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <div>
                      <h4 className="mb-0">
                        {courses.reduce((sum, course) => sum + (course.total_registered || 0), 0)}
                      </h4>
                      <p className="mb-0">Total Registrations</p>
                    </div>
                    <i className="fas fa-users fa-2x opacity-50"></i>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-info text-white">
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <div>
                      <h4 className="mb-0">
                        {new Set(courses.map(c => c.faculty_name)).size}
                      </h4>
                      <p className="mb-0">Faculties</p>
                    </div>
                    <i className="fas fa-university fa-2x opacity-50"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
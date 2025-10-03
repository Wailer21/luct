import React, { useState } from 'react';
import { useAuth } from '../utils/auth';
import { api, API_ENDPOINTS } from '../utils/api';
import { Link } from 'react-router-dom';

export default function Search() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const performSearch = async () => {
    if (!searchTerm.trim()) return;

    setLoading(true);
    try {
      const response = await api.get(`${API_ENDPOINTS.SEARCH}?q=${encodeURIComponent(searchTerm)}`, true);
      if (response.success) {
        setSearchResults(response.data);
      }
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults({ courses: [], reports: [], users: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  };

  return (
    <div className="container-fluid">
      <div className="row mb-4">
        <div className="col-12">
          <h4 className="text-primary mb-1 fw-bold">🔍 Global Search</h4>
          <p className="text-muted">Search across all system data</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card shadow border-0 mb-4">
        <div className="card-body">
          <div className="input-group input-group-lg">
            <input
              type="text"
              className="form-control"
              placeholder="Search courses, reports, users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button
              className="btn btn-primary"
              type="button"
              onClick={performSearch}
              disabled={loading || !searchTerm.trim()}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Searching...
                </>
              ) : (
                <>
                  <i className="fas fa-search me-2"></i>
                  Search
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Search Results */}
      {searchResults && (
        <div className="search-results">
          {/* Courses Results */}
          {searchResults.courses && searchResults.courses.length > 0 && (
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="fas fa-book me-2"></i>
                  Courses ({searchResults.courses.length})
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  {searchResults.courses.map(course => (
                    <div key={course.id} className="col-md-6 mb-3">
                      <div className="card border">
                        <div className="card-body">
                          <h6 className="card-title text-primary">{course.code}</h6>
                          <p className="card-text mb-1">{course.course_name}</p>
                          <small className="text-muted">Faculty: {course.faculty_name}</small>
                          <br />
                          <small className="text-muted">Students: {course.total_registered}</small>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Reports Results */}
          {searchResults.reports && searchResults.reports.length > 0 && (
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="fas fa-clipboard-list me-2"></i>
                  Reports ({searchResults.reports.length})
                </h5>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Report ID</th>
                        <th>Course</th>
                        <th>Lecturer</th>
                        <th>Date</th>
                        <th>Attendance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {searchResults.reports.map(report => {
                        const attendancePercent = report.actual_present && report.total_registered 
                          ? Math.round((report.actual_present / report.total_registered) * 100)
                          : 0;
                        
                        return (
                          <tr key={report.id}>
                            <td>
                              <Link to="/reports" className="text-primary text-decoration-none">
                                LR-{report.id.toString().padStart(6, '0')}
                              </Link>
                            </td>
                            <td>
                              <div>
                                <strong>{report.course_name}</strong>
                                <br />
                                <small className="text-muted">{report.course_code}</small>
                              </div>
                            </td>
                            <td>{report.lecturer_name}</td>
                            <td>
                              {new Date(report.lecture_date).toLocaleDateString()}
                            </td>
                            <td>
                              <span className={`badge ${
                                attendancePercent >= 80 ? 'bg-success' : 
                                attendancePercent >= 60 ? 'bg-warning' : 'bg-danger'
                              }`}>
                                {attendancePercent}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Users Results */}
          {searchResults.users && searchResults.users.length > 0 && (
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="fas fa-users me-2"></i>
                  Users ({searchResults.users.length})
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  {searchResults.users.map(user => (
                    <div key={user.id} className="col-md-4 mb-3">
                      <div className="card border">
                        <div className="card-body text-center">
                          <i className="fas fa-user-circle fa-2x text-muted mb-2"></i>
                          <h6 className="card-title mb-1">
                            {user.first_name} {user.last_name}
                          </h6>
                          <p className="card-text mb-1 text-muted">{user.email}</p>
                          <span className="badge bg-dark text-capitalize">
                            {user.role}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* No Results */}
          {searchResults && 
           (!searchResults.courses || searchResults.courses.length === 0) &&
           (!searchResults.reports || searchResults.reports.length === 0) &&
           (!searchResults.users || searchResults.users.length === 0) && (
            <div className="text-center py-5">
              <i className="fas fa-search fa-4x text-muted mb-3"></i>
              <h5 className="text-muted">No results found</h5>
              <p className="text-muted">Try different search terms</p>
            </div>
          )}
        </div>
      )}

      {/* Initial State */}
      {!searchResults && (
        <div className="text-center py-5">
          <i className="fas fa-search fa-4x text-muted mb-3"></i>
          <h5 className="text-muted">Enter search terms to begin</h5>
          <p className="text-muted">Search across courses, reports, and users</p>
        </div>
      )}
    </div>
  );
}
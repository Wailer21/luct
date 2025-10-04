import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiMethods } from '../utils/api';

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({
    courses: [],
    reports: [],
    lecturers: [],
    users: []
  });
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (query.length >= 2) {
      performSearch();
    } else {
      setResults({ courses: [], reports: [], lecturers: [], users: [] });
      setHasSearched(false);
    }
  }, [query]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const response = await apiMethods.search(query);
      if (response.success) {
        setResults(response.data);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
      setHasSearched(true);
    }
  };

  const getTotalResults = () => {
    return results.courses.length + results.reports.length + 
           results.lecturers.length + results.users.length;
  };

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <h2 className="text-primary mb-4">
            <i className="fas fa-search me-2"></i>
            Search LUCT Reports
          </h2>

          <div className="card shadow mb-4">
            <div className="card-body">
              <div className="input-group">
                <span className="input-group-text bg-primary text-white">
                  <i className="fas fa-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  placeholder="Search for courses, reports, lecturers, users..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <div className="mt-2">
                <small className="text-muted">
                  {query.length > 0 && query.length < 2 
                    ? 'Type at least 2 characters to search...'
                    : hasSearched && `Found ${getTotalResults()} results`
                  }
                </small>
              </div>
            </div>
          </div>

          {loading && (
            <div className="text-center py-4">
              <div className="spinner-border text-primary"></div>
              <p className="mt-2">Searching...</p>
            </div>
          )}

          {hasSearched && !loading && getTotalResults() === 0 && (
            <div className="text-center py-5">
              <i className="fas fa-search fa-3x text-muted mb-3"></i>
              <h5 className="text-muted">No results found</h5>
              <p className="text-muted">Try different search terms</p>
            </div>
          )}

          {!loading && getTotalResults() > 0 && (
            <div className="row">
              {/* Courses Results */}
              {results.courses.length > 0 && (
                <div className="col-lg-6 mb-4">
                  <div className="card shadow-sm">
                    <div className="card-header bg-info text-white">
                      <h6 className="mb-0">
                        <i className="fas fa-book me-2"></i>
                        Courses ({results.courses.length})
                      </h6>
                    </div>
                    <div className="card-body">
                      <div className="list-group list-group-flush">
                        {results.courses.map(course => (
                          <div key={course.id} className="list-group-item px-0">
                            <h6 className="mb-1">{course.course_name}</h6>
                            <p className="mb-1 text-muted">
                              <small>Code: {course.course_code}</small>
                            </p>
                            <p className="mb-1 text-muted">
                              <small>Faculty: {course.faculty_name}</small>
                            </p>
                            <p className="mb-0">
                              <small className="badge bg-primary">
                                {course.total_registered} students
                              </small>
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Reports Results */}
              {results.reports.length > 0 && (
                <div className="col-lg-6 mb-4">
                  <div className="card shadow-sm">
                    <div className="card-header bg-primary text-white">
                      <h6 className="mb-0">
                        <i className="fas fa-clipboard-list me-2"></i>
                        Reports ({results.reports.length})
                      </h6>
                    </div>
                    <div className="card-body">
                      <div className="list-group list-group-flush">
                        {results.reports.map(report => (
                          <div key={report.id} className="list-group-item px-0">
                            <h6 className="mb-1">{report.course_name}</h6>
                            <p className="mb-1 text-muted">
                              <small>
                                Lecturer: {report.lecturer_name} | 
                                Week {report.week_of_reporting}
                              </small>
                            </p>
                            <p className="mb-1 text-muted">
                              <small>
                                Date: {new Date(report.lecture_date).toLocaleDateString()}
                              </small>
                            </p>
                            <p className="mb-0">
                              <small className="badge bg-success">
                                {report.actual_present}/{report.total_registered} attended
                              </small>
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Lecturers Results */}
              {results.lecturers.length > 0 && (
                <div className="col-lg-6 mb-4">
                  <div className="card shadow-sm">
                    <div className="card-header bg-warning text-dark">
                      <h6 className="mb-0">
                        <i className="fas fa-chalkboard-teacher me-2"></i>
                        Lecturers ({results.lecturers.length})
                      </h6>
                    </div>
                    <div className="card-body">
                      <div className="list-group list-group-flush">
                        {results.lecturers.map(lecturer => (
                          <div key={lecturer.id} className="list-group-item px-0">
                            <h6 className="mb-1">
                              {lecturer.first_name} {lecturer.last_name}
                            </h6>
                            <p className="mb-1 text-muted">
                              <small>Email: {lecturer.email}</small>
                            </p>
                            <p className="mb-0">
                              <small className="badge bg-info me-1">
                                {lecturer.total_ratings || 0} ratings
                              </small>
                              <small className="badge bg-success">
                                Avg: {lecturer.average_rating || 0}/5
                              </small>
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Users Results */}
              {results.users.length > 0 && (
                <div className="col-lg-6 mb-4">
                  <div className="card shadow-sm">
                    <div className="card-header bg-secondary text-white">
                      <h6 className="mb-0">
                        <i className="fas fa-users me-2"></i>
                        Users ({results.users.length})
                      </h6>
                    </div>
                    <div className="card-body">
                      <div className="list-group list-group-flush">
                        {results.users.map(user => (
                          <div key={user.id} className="list-group-item px-0">
                            <h6 className="mb-1">
                              {user.first_name} {user.last_name}
                            </h6>
                            <p className="mb-1 text-muted">
                              <small>Email: {user.email}</small>
                            </p>
                            <p className="mb-0">
                              <span className={`badge bg-${
                                user.role === 'Admin' ? 'danger' :
                                user.role === 'PRL' ? 'warning' :
                                user.role === 'PL' ? 'info' :
                                user.role === 'Lecturer' ? 'primary' : 'success'
                              }`}>
                                {user.role}
                              </span>
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
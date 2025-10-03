import React, { useEffect, useState } from 'react';
import { useAuth } from '../utils/auth';
import { api, API_ENDPOINTS } from '../utils/api';

export default function Courses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: '',
    name: '',
    faculty_id: '',
    total_registered: ''
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await api.get(API_ENDPOINTS.COURSES, true);
      if (response.success) {
        setCourses(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post(API_ENDPOINTS.COURSES, form, true);
      if (response.success) {
        setShowForm(false);
        setForm({ code: '', name: '', faculty_id: '', total_registered: '' });
        fetchCourses();
      }
    } catch (error) {
      console.error('Failed to create course:', error);
    }
  };

  const filteredCourses = courses.filter(course =>
    course.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.faculty_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="container-fluid">
        <div className="d-flex justify-content-center align-items-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading courses...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center flex-wrap">
            <div>
              <h4 className="text-primary mb-1 fw-bold">📚 Course Management</h4>
              <p className="text-muted mb-0">
                {user?.role === 'PL' ? 'Manage all courses and assign lecturers' : 'View courses under your stream'}
              </p>
            </div>
            
            <div className="d-flex gap-2 flex-wrap">
              {/* Search Bar */}
              <div className="input-group" style={{ width: '300px' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button className="btn btn-outline-primary" type="button">
                  <i className="fas fa-search"></i>
                </button>
              </div>

              {/* Add Course Button for PL */}
              {user?.role === 'PL' && (
                <button
                  className="btn btn-primary"
                  onClick={() => setShowForm(true)}
                >
                  <i className="fas fa-plus me-2"></i>
                  Add Course
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Course Modal */}
      {showForm && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add New Course</h5>
                <button type="button" className="btn-close" onClick={() => setShowForm(false)}></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Course Code</label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.code}
                      onChange={(e) => setForm({ ...form, code: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Course Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Total Registered</label>
                    <input
                      type="number"
                      className="form-control"
                      value={form.total_registered}
                      onChange={(e) => setForm({ ...form, total_registered: e.target.value })}
                      required
                    />
                  </div>
                  <div className="d-flex gap-2 justify-content-end">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Add Course
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Courses Table */}
      <div className="card shadow border-0">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead className="table-light">
                <tr>
                  <th>Course Code</th>
                  <th>Course Name</th>
                  <th>Faculty</th>
                  <th>Total Registered</th>
                  {user?.role === 'PL' && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredCourses.map(course => (
                  <tr key={course.id}>
                    <td>
                      <strong className="text-primary">{course.code}</strong>
                    </td>
                    <td>
                      <strong>{course.course_name}</strong>
                    </td>
                    <td>{course.faculty_name}</td>
                    <td>
                      <span className="badge bg-info">{course.total_registered}</span>
                    </td>
                    {user?.role === 'PL' && (
                      <td>
                        <button className="btn btn-sm btn-outline-primary me-2">
                          <i className="fas fa-edit"></i>
                        </button>
                        <button className="btn btn-sm btn-outline-danger">
                          <i className="fas fa-trash"></i>
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredCourses.length === 0 && (
            <div className="text-center py-5">
              <i className="fas fa-book fa-4x text-muted mb-3"></i>
              <h5 className="text-muted">No courses found</h5>
              <p className="text-muted">Try adjusting your search terms</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
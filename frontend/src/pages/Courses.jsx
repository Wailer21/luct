import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/auth';
import { apiMethods } from '../utils/api';
import { exportCoursesToExcel } from '../utils/excelExport';

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    faculty_id: '',
    total_registered: ''
  });
  const [formLoading, setFormLoading] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [coursesRes, facultiesRes] = await Promise.all([
        apiMethods.getCourses(),
        apiMethods.getFaculties()
      ]);

      if (coursesRes.success) setCourses(coursesRes.data);
      if (facultiesRes.success) setFaculties(facultiesRes.data);
    } catch (err) {
      setError('Failed to fetch data');
      console.error('Data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const response = await apiMethods.post(apiMethods.API_ENDPOINTS.COURSES, formData);
      
      if (response.success) {
        setCourses([...courses, response.data]);
        setShowForm(false);
        setFormData({
          name: '',
          code: '',
          faculty_id: '',
          total_registered: ''
        });
      } else {
        setError(response.message || 'Failed to create course');
      }
    } catch (err) {
      setError('An error occurred while creating the course');
      console.error('Course creation error:', err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleExport = () => {
    const success = exportCoursesToExcel(courses);
    if (success) {
      console.log('Courses exported successfully');
    }
  };

  if (!['PL', 'PRL', 'Admin'].includes(user?.role)) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-danger">
          <i className="fas fa-exclamation-triangle me-2"></i>
          Access denied. Course management requires PL, PRL, or Admin role.
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
                <i className="fas fa-book me-2"></i>
                Course Management
              </h2>
              <p className="text-muted mb-0">Manage academic courses and programs</p>
            </div>
            <div className="d-flex gap-2">
              <button
                className="btn btn-success"
                onClick={handleExport}
                disabled={courses.length === 0}
              >
                <i className="fas fa-file-excel me-2"></i>
                Export Courses
              </button>
              <button
                className="btn btn-primary"
                onClick={() => setShowForm(!showForm)}
              >
                <i className="fas fa-plus me-2"></i>
                Add Course
              </button>
            </div>
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">
              <i className="fas fa-exclamation-circle me-2"></i>
              {error}
            </div>
          )}

          {showForm && (
            <div className="card shadow mb-4">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">
                  <i className="fas fa-plus-circle me-2"></i>
                  Add New Course
                </h5>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="name" className="form-label">Course Name</label>
                      <input
                        type="text"
                        className="form-control"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        disabled={formLoading}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="code" className="form-label">Course Code</label>
                      <input
                        type="text"
                        className="form-control"
                        id="code"
                        name="code"
                        value={formData.code}
                        onChange={handleChange}
                        required
                        disabled={formLoading}
                      />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="faculty_id" className="form-label">Faculty</label>
                      <select
                        className="form-select"
                        id="faculty_id"
                        name="faculty_id"
                        value={formData.faculty_id}
                        onChange={handleChange}
                        required
                        disabled={formLoading}
                      >
                        <option value="">Select Faculty</option>
                        {faculties.map(faculty => (
                          <option key={faculty.id} value={faculty.id}>
                            {faculty.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="total_registered" className="form-label">Total Registered</label>
                      <input
                        type="number"
                        className="form-control"
                        id="total_registered"
                        name="total_registered"
                        value={formData.total_registered}
                        onChange={handleChange}
                        min="0"
                        required
                        disabled={formLoading}
                      />
                    </div>
                  </div>
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowForm(false)}
                      disabled={formLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={formLoading}
                    >
                      {formLoading ? 'Creating...' : 'Create Course'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="card shadow">
            <div className="card-body">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary"></div>
                  <p className="mt-2">Loading courses...</p>
                </div>
              ) : courses.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-book fa-3x text-muted mb-3"></i>
                  <h5 className="text-muted">No courses found</h5>
                  <p className="text-muted">Get started by adding your first course</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Course Name</th>
                        <th>Faculty</th>
                        <th>Registered Students</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courses.map((course) => (
                        <tr key={course.id}>
                          <td>
                            <strong>{course.code}</strong>
                          </td>
                          <td>{course.course_name}</td>
                          <td>{course.faculty_name}</td>
                          <td>
                            <span className="badge bg-primary">
                              {course.total_registered} students
                            </span>
                          </td>
                          <td>
                            <button className="btn btn-sm btn-outline-primary me-1">
                              <i className="fas fa-edit"></i>
                            </button>
                            <button className="btn btn-sm btn-outline-danger">
                              <i className="fas fa-trash"></i>
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
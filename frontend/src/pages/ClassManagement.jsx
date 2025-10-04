import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/auth';
import { apiMethods } from '../utils/api';
import { exportToExcel } from '../utils/excelExport';

export default function ClassManagement() {
  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    class_name: '',
    course_id: '',
    venue: '',
    scheduled_time: '',
    lecturer_id: ''
  });
  const [formLoading, setFormLoading] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [classesRes, coursesRes, lecturersRes] = await Promise.all([
        apiMethods.get('/api/classes'),
        apiMethods.get('/api/courses'),
        apiMethods.get('/api/users/lecturers')
      ]);

      if (classesRes.success) setClasses(classesRes.data);
      if (coursesRes.success) setCourses(coursesRes.data);
      if (lecturersRes.success) setLecturers(lecturersRes.data);
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
      const response = await apiMethods.post('/api/classes', formData);
      
      if (response.success) {
        setClasses([...classes, response.data]);
        setShowForm(false);
        setFormData({
          class_name: '',
          course_id: '',
          venue: '',
          scheduled_time: '',
          lecturer_id: ''
        });
        setError('');
        setSuccess('Class created successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.message || 'Failed to create class');
      }
    } catch (err) {
      setError('An error occurred while creating the class');
      console.error('Class creation error:', err);
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

  const handleAssignLecturer = async (classId, lecturerId, className) => {
    try {
      const response = await apiMethods.put(`/api/classes/${classId}/assign-lecturer`, {
        lecturer_id: lecturerId
      });
      
      if (response.success) {
        setClasses(classes.map(cls => 
          cls.id === classId ? response.data : cls
        ));
        setSuccess(`Lecturer assigned to ${className}`);
        setError('');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.message || 'Failed to assign lecturer');
      }
    } catch (err) {
      setError('An error occurred while assigning lecturer');
      console.error('Assign lecturer error:', err);
    }
  };

  const handleRemoveLecturer = async (classId, className) => {
    if (!window.confirm(`Remove lecturer from ${className}?`)) return;

    try {
      const response = await apiMethods.put(`/api/classes/${classId}/remove-lecturer`);
      
      if (response.success) {
        setClasses(classes.map(cls => 
          cls.id === classId ? response.data : cls
        ));
        setSuccess(`Lecturer removed from ${className}`);
        setError('');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.message || 'Failed to remove lecturer');
      }
    } catch (err) {
      setError('An error occurred while removing lecturer');
      console.error('Remove lecturer error:', err);
    }
  };

  const handleDeleteClass = async (classId, className) => {
    if (!window.confirm(`Delete ${className}?`)) return;

    try {
      const response = await apiMethods.delete(`/api/classes/${classId}`);
      
      if (response.success) {
        setClasses(classes.filter(cls => cls.id !== classId));
        setSuccess(`${className} deleted successfully`);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.message || 'Failed to delete class');
      }
    } catch (err) {
      setError('An error occurred while deleting the class');
      console.error('Class deletion error:', err);
    }
  };

  const handleExport = () => {
    const exportData = classes.map(classItem => ({
      'Class Code': classItem.class_name,
      'Course Code': classItem.course_code,
      'Course Name': classItem.course_name,
      'Faculty': classItem.faculty_name,
      'Lecturer': classItem.lecturer_name || 'Not Assigned',
      'Lecturer Email': classItem.lecturer_email || 'N/A',
      'Venue': classItem.venue || 'Not Specified',
      'Schedule': classItem.scheduled_time || 'Not Scheduled'
    }));

    exportToExcel(exportData, 'class-codes', 'Class Codes');
  };

  // Group classes by program for better organization
  const getProgramFromCode = (classCode) => {
    if (classCode.startsWith('BSCITY')) return 'Information Technology';
    if (classCode.startsWith('BSCSEM')) return 'Software Engineering & Multimedia';
    if (classCode.startsWith('BSCBIT')) return 'Business Information Technology';
    if (classCode.startsWith('BSCECOM')) return 'E-Commerce';
    if (classCode.startsWith('BSCMC')) return 'Multimedia Computing';
    if (classCode.startsWith('BSCIVC')) return 'Interactive Computing';
    if (classCode.startsWith('BSCBIS')) return 'Business Information Systems';
    return 'Other';
  };

  const groupedClasses = classes.reduce((acc, classItem) => {
    const program = getProgramFromCode(classItem.class_name);
    if (!acc[program]) {
      acc[program] = [];
    }
    acc[program].push(classItem);
    return acc;
  }, {});

  if (!['PL', 'Admin'].includes(user?.role)) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-danger">
          <i className="fas fa-exclamation-triangle me-2"></i>
          Access denied. Class management requires PL or Admin role.
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
                <i className="fas fa-graduation-cap me-2"></i>
                Class Code Management
              </h2>
              <p className="text-muted mb-0">Manage class codes and lecturer assignments</p>
            </div>
            <div className="d-flex gap-2">
              <button
                className="btn btn-success"
                onClick={handleExport}
                disabled={classes.length === 0}
              >
                <i className="fas fa-file-excel me-2"></i>
                Export Class Codes
              </button>
              <button
                className="btn btn-primary"
                onClick={() => setShowForm(!showForm)}
              >
                <i className="fas fa-plus me-2"></i>
                Add Class Code
              </button>
            </div>
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">
              <i className="fas fa-exclamation-circle me-2"></i>
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success" role="alert">
              <i className="fas fa-check-circle me-2"></i>
              {success}
            </div>
          )}

          {showForm && (
            <div className="card shadow mb-4">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">
                  <i className="fas fa-plus-circle me-2"></i>
                  Add New Class Code
                </h5>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="class_name" className="form-label">Class Code *</label>
                      <input
                        type="text"
                        className="form-control"
                        id="class_name"
                        name="class_name"
                        value={formData.class_name}
                        onChange={handleChange}
                        placeholder="e.g., BSCSEM1-A, BSCITY2-B"
                        required
                        disabled={formLoading}
                      />
                      <div className="form-text">
                        Format: ProgramCodeYear-Group (e.g., BSCSEM1-A, BSCITY2-B)
                      </div>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="course_id" className="form-label">Course *</label>
                      <select
                        className="form-select"
                        id="course_id"
                        name="course_id"
                        value={formData.course_id}
                        onChange={handleChange}
                        required
                        disabled={formLoading}
                      >
                        <option value="">Select Course</option>
                        {courses.map(course => (
                          <option key={course.id} value={course.id}>
                            {course.code} - {course.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="venue" className="form-label">Venue</label>
                      <input
                        type="text"
                        className="form-control"
                        id="venue"
                        name="venue"
                        value={formData.venue}
                        onChange={handleChange}
                        placeholder="e.g., Lecture Hall A, MM Lab 1"
                        disabled={formLoading}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="scheduled_time" className="form-label">Schedule</label>
                      <input
                        type="text"
                        className="form-control"
                        id="scheduled_time"
                        name="scheduled_time"
                        value={formData.scheduled_time}
                        onChange={handleChange}
                        placeholder="e.g., 08:00-10:00, 14:00-16:00"
                        disabled={formLoading}
                      />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="lecturer_id" className="form-label">Assign Lecturer</label>
                      <select
                        className="form-select"
                        id="lecturer_id"
                        name="lecturer_id"
                        value={formData.lecturer_id}
                        onChange={handleChange}
                        disabled={formLoading}
                      >
                        <option value="">Select Lecturer (Optional)</option>
                        {lecturers.map(lecturer => (
                          <option key={lecturer.id} value={lecturer.id}>
                            {lecturer.first_name} {lecturer.last_name}
                          </option>
                        ))}
                      </select>
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
                      {formLoading ? (
                        <>
                          <div className="spinner-border spinner-border-sm me-2"></div>
                          Creating...
                        </>
                      ) : (
                        'Add Class Code'
                      )}
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
                  <p className="mt-2">Loading class codes...</p>
                </div>
              ) : classes.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-graduation-cap fa-3x text-muted mb-3"></i>
                  <h5 className="text-muted">No class codes found</h5>
                  <p className="text-muted">Get started by adding your first class code</p>
                </div>
              ) : (
                Object.entries(groupedClasses).map(([program, programClasses]) => (
                  <div key={program} className="mb-5">
                    <h5 className="text-primary mb-3 border-bottom pb-2">
                      <i className="fas fa-folder me-2"></i>
                      {program}
                    </h5>
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Class Code</th>
                            <th>Course</th>
                            <th>Faculty</th>
                            <th>Lecturer</th>
                            <th>Venue</th>
                            <th>Schedule</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {programClasses.map((classItem) => (
                            <tr key={classItem.id}>
                              <td>
                                <strong className="text-primary">{classItem.class_name}</strong>
                              </td>
                              <td>
                                <div>
                                  <strong>{classItem.course_code}</strong>
                                  <br />
                                  <small className="text-muted">{classItem.course_name}</small>
                                </div>
                              </td>
                              <td>{classItem.faculty_name}</td>
                              <td>
                                {classItem.lecturer_name ? (
                                  <div>
                                    <div className="d-flex align-items-center">
                                      <strong>{classItem.lecturer_name}</strong>
                                      <button
                                        className="btn btn-sm btn-outline-danger ms-2"
                                        onClick={() => handleRemoveLecturer(classItem.id, classItem.class_name)}
                                        title="Remove Lecturer"
                                      >
                                        <i className="fas fa-times"></i>
                                      </button>
                                    </div>
                                    <small className="text-muted">{classItem.lecturer_email}</small>
                                  </div>
                                ) : (
                                  <select
                                    className="form-select form-select-sm"
                                    value=""
                                    onChange={(e) => handleAssignLecturer(classItem.id, e.target.value, classItem.class_name)}
                                  >
                                    <option value="">Assign Lecturer</option>
                                    {lecturers.map(lecturer => (
                                      <option key={lecturer.id} value={lecturer.id}>
                                        {lecturer.first_name} {lecturer.last_name}
                                      </option>
                                    ))}
                                  </select>
                                )}
                              </td>
                              <td>
                                {classItem.venue || (
                                  <span className="text-muted">Not specified</span>
                                )}
                              </td>
                              <td>
                                {classItem.scheduled_time || (
                                  <span className="text-muted">Not scheduled</span>
                                )}
                              </td>
                              <td>
                                <div className="btn-group">
                                  <button className="btn btn-sm btn-outline-primary">
                                    <i className="fas fa-edit"></i>
                                  </button>
                                  {!classItem.lecturer_name && (
                                    <button 
                                      className="btn btn-sm btn-outline-danger"
                                      onClick={() => handleDeleteClass(classItem.id, classItem.class_name)}
                                    >
                                      <i className="fas fa-trash"></i>
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
// PRLClasses.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/auth';
import { apiMethods } from '../utils/api';

export default function PRLClasses() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [view, setView] = useState('grid');
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [formData, setFormData] = useState({
    class_name: '',  // Changed from 'code'
    course_id: '',   // Added course_id
    venue: '',       // Added venue
    scheduled_time: '', // Changed from 'schedule'
    lecturer_id: ''  // Added lecturer_id
  });

  const { user } = useAuth();

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiMethods.getClasses();
      
      if (response.success) {
        setClasses(response.data || []);
      } else {
        setError(response.message || 'Failed to fetch classes');
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      setError('Unable to load classes. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingClass) {
        // Update existing class - use the correct endpoint structure
        const response = await apiMethods.updateClass(editingClass.id, formData);
        if (response.success) {
          setClasses(prev => prev.map(cls => 
            cls.id === editingClass.id ? response.data : cls
          ));
          setShowForm(false);
          setEditingClass(null);
          resetForm();
        }
      } else {
        // Create new class - use the correct endpoint structure
        const response = await apiMethods.createClass(formData);
        if (response.success) {
          setClasses(prev => [...prev, response.data]);
          setShowForm(false);
          resetForm();
        }
      }
    } catch (error) {
      console.error('Error saving class:', error);
      alert('Failed to save class. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      class_name: '',
      course_id: '',
      venue: '',
      scheduled_time: '',
      lecturer_id: ''
    });
    setEditingClass(null);
  };

  const handleEdit = (classItem) => {
    setFormData({
      class_name: classItem.class_name || classItem.code || '',
      course_id: classItem.course_id || '',
      venue: classItem.venue || '',
      scheduled_time: classItem.scheduled_time || classItem.schedule || '',
      lecturer_id: classItem.lecturer_id || ''
    });
    setEditingClass(classItem);
    setShowForm(true);
  };

  const handleDelete = async (classId) => {
    if (window.confirm('Are you sure you want to delete this class?')) {
      try {
        const response = await apiMethods.deleteClass(classId);
        if (response.success) {
          setClasses(prev => prev.filter(cls => cls.id !== classId));
        }
      } catch (error) {
        console.error('Error deleting class:', error);
        alert('Failed to delete class. Please try again.');
      }
    }
  };

  const handleAddNew = () => {
    resetForm();
    setShowForm(true);
  };

  // Helper function to get display values
  const getDisplayValue = (classItem, field) => {
    switch (field) {
      case 'code':
        return classItem.class_name || classItem.code || 'N/A';
      case 'name':
        return classItem.course_name || classItem.name || 'N/A';
      case 'instructor':
        return classItem.instructor_name || classItem.lecturer_name || 'TBA';
      case 'schedule':
        return classItem.scheduled_time || classItem.schedule || 'Not set';
      case 'venue':
        return classItem.venue || 'Not specified';
      default:
        return classItem[field] || 'N/A';
    }
  };

  // Quick Stats Calculation
  const totalClasses = classes.length;
  const activeClasses = classes.filter(c => c.status === 'active').length;
  const totalStudents = classes.reduce((sum, c) => sum + (c.enrolled_students || 0), 0);
  const totalInstructors = new Set(classes.map(c => c.lecturer_id).filter(Boolean)).size;

  const ClassGridView = () => (
    <div className="row">
      {classes.map(classItem => (
        <div key={classItem.id} className="col-md-6 col-lg-4 mb-4">
          <div className="card h-100 shadow-sm">
            <div className="card-header bg-light d-flex justify-content-between align-items-center">
              <strong className="text-primary">{getDisplayValue(classItem, 'code')}</strong>
              <span className="badge bg-success">Active</span>
            </div>
            <div className="card-body">
              <h6 className="card-title">{getDisplayValue(classItem, 'name')}</h6>
              <p className="card-text small text-muted">
                {classItem.course_code ? `${classItem.course_code} - ${classItem.course_name}` : 'Course information'}
              </p>
              
              <div className="class-info mt-3">
                <div className="row text-center g-2">
                  <div className="col-6">
                    <div className="border rounded p-2">
                      <div className="text-primary fw-bold">{classItem.enrolled_students || 0}</div>
                      <small className="text-muted">Students</small>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="border rounded p-2">
                      <div className="text-primary fw-bold">{classItem.sections || 1}</div>
                      <small className="text-muted">Sections</small>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <small className="text-muted">
                  <i className="fas fa-user-tie me-1"></i>
                  {getDisplayValue(classItem, 'instructor')}
                </small>
                <br />
                <small className="text-muted">
                  <i className="fas fa-calendar me-1"></i>
                  {getDisplayValue(classItem, 'schedule')}
                </small>
                <br />
                <small className="text-muted">
                  <i className="fas fa-map-marker-alt me-1"></i>
                  {getDisplayValue(classItem, 'venue')}
                </small>
              </div>
            </div>
            <div className="card-footer bg-transparent">
              <div className="btn-group w-100">
                <button 
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => setSelectedClass(classItem)}
                  title="View Details"
                >
                  <i className="fas fa-eye"></i>
                </button>
                <button 
                  className="btn btn-sm btn-outline-warning" 
                  title="Edit"
                  onClick={() => handleEdit(classItem)}
                >
                  <i className="fas fa-edit"></i>
                </button>
                <button 
                  className="btn btn-sm btn-outline-danger" 
                  title="Delete"
                  onClick={() => handleDelete(classItem.id)}
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const ClassListView = () => (
    <div className="table-responsive">
      <table className="table table-striped table-hover">
        <thead className="table-light">
          <tr>
            <th>Class Code</th>
            <th>Course</th>
            <th>Faculty</th>
            <th>Instructor</th>
            <th>Venue</th>
            <th>Schedule</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {classes.map(classItem => (
            <tr key={classItem.id}>
              <td>
                <strong className="text-primary">{getDisplayValue(classItem, 'code')}</strong>
              </td>
              <td>
                <div>
                  <strong>{classItem.course_code}</strong>
                  <br />
                  <small className="text-muted">{classItem.course_name}</small>
                </div>
              </td>
              <td>{classItem.faculty_name || 'N/A'}</td>
              <td>{getDisplayValue(classItem, 'instructor')}</td>
              <td>{getDisplayValue(classItem, 'venue')}</td>
              <td>
                <small className="text-muted">{getDisplayValue(classItem, 'schedule')}</small>
              </td>
              <td>
                <div className="btn-group">
                  <button 
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => setSelectedClass(classItem)}
                    title="View Details"
                  >
                    <i className="fas fa-eye"></i>
                  </button>
                  <button 
                    className="btn btn-sm btn-outline-warning"
                    onClick={() => handleEdit(classItem)}
                    title="Edit"
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                  <button 
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => handleDelete(classItem.id)}
                    title="Delete"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Class Form Component
  const ClassForm = () => (
    <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}} tabIndex="-1">
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">
              <i className="fas fa-plus me-2"></i>
              {editingClass ? 'Edit Class' : 'Add New Class'}
            </h5>
            <button 
              type="button" 
              className="btn-close btn-close-white"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
            ></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Class Code *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="class_name"
                      value={formData.class_name}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g., BSCSEM1-A, BSCITY2-B"
                    />
                    <div className="form-text">
                      Format: ProgramCodeYear-Group (e.g., BSCSEM1-A, BSCITY2-B)
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Course ID *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="course_id"
                      value={formData.course_id}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g., 1, 2, 3"
                    />
                    <div className="form-text">
                      Enter the course ID from the courses table
                    </div>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Venue</label>
                    <input
                      type="text"
                      className="form-control"
                      name="venue"
                      value={formData.venue}
                      onChange={handleInputChange}
                      placeholder="e.g., Lecture Hall A, Lab 101"
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Schedule</label>
                    <input
                      type="text"
                      className="form-control"
                      name="scheduled_time"
                      value={formData.scheduled_time}
                      onChange={handleInputChange}
                      placeholder="e.g., Mon/Wed 10:00 AM, 14:00-16:00"
                    />
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Lecturer ID</label>
                    <input
                      type="text"
                      className="form-control"
                      name="lecturer_id"
                      value={formData.lecturer_id}
                      onChange={handleInputChange}
                      placeholder="e.g., 2, 3, 4 (optional)"
                    />
                    <div className="form-text">
                      Enter lecturer user ID (optional)
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                <i className="fas fa-save me-2"></i>
                {editingClass ? 'Update Class' : 'Create Class'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-danger">
          <h4>Error Loading Classes</h4>
          <p>{error}</p>
          <div className="mt-3">
            <button className="btn btn-primary me-2" onClick={fetchClasses}>
              <i className="fas fa-sync-alt me-2"></i>
              Try Again
            </button>
            <button className="btn btn-outline-secondary" onClick={() => setError(null)}>
              Go Back
            </button>
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
            <h2 className="text-primary mb-0">
              <i className="fas fa-users me-2"></i>
              Class Management
            </h2>
            <div>
              <button 
                className={`btn btn-sm ${view === 'grid' ? 'btn-primary' : 'btn-outline-primary'} me-2`}
                onClick={() => setView('grid')}
              >
                <i className="fas fa-th-large me-1"></i> Grid
              </button>
              <button 
                className={`btn btn-sm ${view === 'list' ? 'btn-primary' : 'btn-outline-primary'} me-2`}
                onClick={() => setView('list')}
              >
                <i className="fas fa-list me-1"></i> List
              </button>
              <button 
                className="btn btn-primary btn-sm"
                onClick={handleAddNew}
              >
                <i className="fas fa-plus me-1"></i>
                Add Class
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="row mb-4">
            <div className="col-md-3">
              <div className="card bg-primary text-white">
                <div className="card-body text-center">
                  <h3 className="mb-0">{totalClasses}</h3>
                  <p className="mb-0">Total Classes</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-success text-white">
                <div className="card-body text-center">
                  <h3 className="mb-0">{activeClasses}</h3>
                  <p className="mb-0">Active Classes</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-warning text-white">
                <div className="card-body text-center">
                  <h3 className="mb-0">{totalStudents}</h3>
                  <p className="mb-0">Total Students</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-info text-white">
                <div className="card-body text-center">
                  <h3 className="mb-0">{totalInstructors}</h3>
                  <p className="mb-0">Instructors</p>
                </div>
              </div>
            </div>
          </div>

          {/* Classes Display */}
          <div className="card shadow">
            <div className="card-header bg-light d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="fas fa-chalkboard me-2"></i>
                Program Classes ({classes.length})
              </h5>
              <div className="d-flex gap-2">
                <button 
                  className="btn btn-success btn-sm"
                  onClick={handleAddNew}
                >
                  <i className="fas fa-plus me-1"></i>
                  Add Class
                </button>
                <button 
                  className="btn btn-outline-secondary btn-sm"
                  onClick={fetchClasses}
                  title="Refresh"
                >
                  <i className="fas fa-sync-alt"></i>
                </button>
              </div>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary"></div>
                  <p className="mt-2">Loading classes...</p>
                </div>
              ) : classes.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-users fa-3x text-muted mb-3"></i>
                  <h5 className="text-muted">No classes available</h5>
                  <p className="text-muted">Create classes to manage your program</p>
                  <button className="btn btn-primary mt-2" onClick={handleAddNew}>
                    <i className="fas fa-plus me-2"></i>
                    Create First Class
                  </button>
                </div>
              ) : (
                <>
                  {view === 'grid' ? <ClassGridView /> : <ClassListView />}
                </>
              )}
            </div>
          </div>

          {/* Class Detail Modal */}
          {selectedClass && (
            <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}} tabIndex="-1">
              <div className="modal-dialog modal-lg">
                <div className="modal-content">
                  <div className="modal-header bg-primary text-white">
                    <h5 className="modal-title">
                      {getDisplayValue(selectedClass, 'code')} - {getDisplayValue(selectedClass, 'name')}
                    </h5>
                    <button 
                      type="button" 
                      className="btn-close btn-close-white"
                      onClick={() => setSelectedClass(null)}
                    ></button>
                  </div>
                  <div className="modal-body">
                    <div className="row">
                      <div className="col-md-6">
                        <h6>Class Information</h6>
                        <p><strong>Class Code:</strong> {getDisplayValue(selectedClass, 'code')}</p>
                        <p><strong>Course:</strong> {selectedClass.course_name} ({selectedClass.course_code})</p>
                        <p><strong>Instructor:</strong> {getDisplayValue(selectedClass, 'instructor')}</p>
                        <p><strong>Venue:</strong> {getDisplayValue(selectedClass, 'venue')}</p>
                        <p><strong>Schedule:</strong> {getDisplayValue(selectedClass, 'schedule')}</p>
                      </div>
                      <div className="col-md-6">
                        <h6>Additional Information</h6>
                        <p><strong>Faculty:</strong> {selectedClass.faculty_name || 'N/A'}</p>
                        <p><strong>Students:</strong> {selectedClass.enrolled_students || 0}</p>
                        <p><strong>Sections:</strong> {selectedClass.sections || 1}</p>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button 
                      className="btn btn-secondary"
                      onClick={() => setSelectedClass(null)}
                    >
                      Close
                    </button>
                    <button 
                      className="btn btn-warning"
                      onClick={() => {
                        handleEdit(selectedClass);
                        setSelectedClass(null);
                      }}
                    >
                      <i className="fas fa-edit me-2"></i>
                      Edit Class
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Class Form Modal */}
          {showForm && <ClassForm />}
        </div>
      </div>
    </div>
  );
}
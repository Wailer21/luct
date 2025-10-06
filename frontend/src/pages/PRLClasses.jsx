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
    code: '',
    name: '',
    description: '',
    instructor_name: '',
    schedule: '',
    enrolled_students: 0,
    sections: 1,
    status: 'upcoming'
  });

  const { user } = useAuth();

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the getClasses method directly
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
        // Update existing class
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
        // Create new class
        const response = await apiMethods.createClass({
          ...formData,
          program_id: user?.programId
        });
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
      code: '',
      name: '',
      description: '',
      instructor_name: '',
      schedule: '',
      enrolled_students: 0,
      sections: 1,
      status: 'upcoming'
    });
    setEditingClass(null);
  };

  const handleEdit = (classItem) => {
    setFormData({
      code: classItem.code,
      name: classItem.name,
      description: classItem.description || '',
      instructor_name: classItem.instructor_name || '',
      schedule: classItem.schedule || '',
      enrolled_students: classItem.enrolled_students || 0,
      sections: classItem.sections || 1,
      status: classItem.status || 'upcoming'
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

  // Quick Stats Calculation
  const totalClasses = classes.length;
  const activeClasses = classes.filter(c => c.status === 'active').length;
  const totalStudents = classes.reduce((sum, c) => sum + (c.enrolled_students || 0), 0);
  const totalInstructors = new Set(classes.map(c => c.instructor_id).filter(Boolean)).size;

  const ClassGridView = () => (
    <div className="row">
      {classes.map(classItem => (
        <div key={classItem.id} className="col-md-6 col-lg-4 mb-4">
          <div className="card h-100 shadow-sm">
            <div className="card-header bg-light d-flex justify-content-between align-items-center">
              <strong className="text-primary">{classItem.code}</strong>
              <span className={`badge ${
                classItem.status === 'active' ? 'bg-success' : 
                classItem.status === 'upcoming' ? 'bg-warning' : 'bg-secondary'
              }`}>
                {classItem.status || 'unknown'}
              </span>
            </div>
            <div className="card-body">
              <h6 className="card-title">{classItem.name}</h6>
              <p className="card-text small text-muted">{classItem.description || 'No description available'}</p>
              
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
                  {classItem.instructor_name || 'TBA'}
                </small>
                <br />
                <small className="text-muted">
                  <i className="fas fa-calendar me-1"></i>
                  {classItem.schedule || 'Schedule not set'}
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
                <button className="btn btn-sm btn-outline-info" title="Analytics">
                  <i className="fas fa-chart-bar"></i>
                </button>
                <button className="btn btn-sm btn-outline-success" title="Students">
                  <i className="fas fa-users"></i>
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
            <th>Class Name</th>
            <th>Instructor</th>
            <th>Students</th>
            <th>Sections</th>
            <th>Schedule</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {classes.map(classItem => (
            <tr key={classItem.id}>
              <td>
                <strong className="text-primary">{classItem.code}</strong>
              </td>
              <td>{classItem.name}</td>
              <td>{classItem.instructor_name || 'TBA'}</td>
              <td>
                <span className="badge bg-info">{classItem.enrolled_students || 0}</span>
              </td>
              <td>
                <span className="badge bg-secondary">{classItem.sections || 1}</span>
              </td>
              <td>
                <small className="text-muted">{classItem.schedule || 'Not set'}</small>
              </td>
              <td>
                <span className={`badge ${
                  classItem.status === 'active' ? 'bg-success' : 
                  classItem.status === 'upcoming' ? 'bg-warning' : 'bg-secondary'
                }`}>
                  {classItem.status || 'unknown'}
                </span>
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
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g., CS101"
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Status *</label>
                    <select
                      className="form-select"
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="upcoming">Upcoming</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Class Name *</label>
                <input
                  type="text"
                  className="form-control"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Introduction to Programming"
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Class description..."
                />
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Instructor Name</label>
                    <input
                      type="text"
                      className="form-control"
                      name="instructor_name"
                      value={formData.instructor_name}
                      onChange={handleInputChange}
                      placeholder="e.g., Dr. John Smith"
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Schedule</label>
                    <input
                      type="text"
                      className="form-control"
                      name="schedule"
                      value={formData.schedule}
                      onChange={handleInputChange}
                      placeholder="e.g., Mon/Wed 10:00 AM"
                    />
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Enrolled Students</label>
                    <input
                      type="number"
                      className="form-control"
                      name="enrolled_students"
                      value={formData.enrolled_students}
                      onChange={handleInputChange}
                      min="0"
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Sections</label>
                    <input
                      type="number"
                      className="form-control"
                      name="sections"
                      value={formData.sections}
                      onChange={handleInputChange}
                      min="1"
                    />
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
                      {selectedClass.code} - {selectedClass.name}
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
                        <p><strong>Description:</strong> {selectedClass.description || 'No description'}</p>
                        <p><strong>Instructor:</strong> {selectedClass.instructor_name || 'TBA'}</p>
                        <p><strong>Schedule:</strong> {selectedClass.schedule || 'Not set'}</p>
                      </div>
                      <div className="col-md-6">
                        <h6>Statistics</h6>
                        <p><strong>Enrolled Students:</strong> {selectedClass.enrolled_students || 0}</p>
                        <p><strong>Sections:</strong> {selectedClass.sections || 1}</p>
                        <p><strong>Status:</strong> 
                          <span className={`badge ms-2 ${
                            selectedClass.status === 'active' ? 'bg-success' : 
                            selectedClass.status === 'upcoming' ? 'bg-warning' : 'bg-secondary'
                          }`}>
                            {selectedClass.status || 'unknown'}
                          </span>
                        </p>
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
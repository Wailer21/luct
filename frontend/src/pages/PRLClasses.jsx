// PRLClasses.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/auth';
import { apiMethods } from '../utils/api';

export default function PRLClasses() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState(null);
  const [view, setView] = useState('grid'); // 'grid' or 'list'

  const { user } = useAuth();

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await apiMethods.getProgramClasses(user.programId);
      if (response.success) {
        setClasses(response.data);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoading(false);
    }
  };

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
                {classItem.status}
              </span>
            </div>
            <div className="card-body">
              <h6 className="card-title">{classItem.name}</h6>
              <p className="card-text small text-muted">{classItem.description}</p>
              
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
                >
                  <i className="fas fa-eye"></i>
                </button>
                <button className="btn btn-sm btn-outline-info">
                  <i className="fas fa-chart-bar"></i>
                </button>
                <button className="btn btn-sm btn-outline-success">
                  <i className="fas fa-users"></i>
                </button>
                <button className="btn btn-sm btn-outline-warning">
                  <i className="fas fa-edit"></i>
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
                  {classItem.status}
                </span>
              </td>
              <td>
                <div className="btn-group">
                  <button 
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => setSelectedClass(classItem)}
                  >
                    <i className="fas fa-eye"></i>
                  </button>
                  <button className="btn btn-sm btn-outline-info">
                    <i className="fas fa-chart-bar"></i>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

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
                className={`btn btn-sm ${view === 'list' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setView('list')}
              >
                <i className="fas fa-list me-1"></i> List
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="row mb-4">
            <div className="col-md-3">
              <div className="card bg-primary text-white">
                <div className="card-body text-center">
                  <h3 className="mb-0">{classes.length}</h3>
                  <p className="mb-0">Total Classes</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-success text-white">
                <div className="card-body text-center">
                  <h3 className="mb-0">
                    {classes.filter(c => c.status === 'active').length}
                  </h3>
                  <p className="mb-0">Active Classes</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-warning text-white">
                <div className="card-body text-center">
                  <h3 className="mb-0">
                    {classes.reduce((sum, c) => sum + (c.enrolled_students || 0), 0)}
                  </h3>
                  <p className="mb-0">Total Students</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-info text-white">
                <div className="card-body text-center">
                  <h3 className="mb-0">
                    {new Set(classes.map(c => c.instructor_id)).size}
                  </h3>
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
                Program Classes
              </h5>
              <button className="btn btn-primary btn-sm">
                <i className="fas fa-plus me-1"></i>
                Add Class
              </button>
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
                  <button className="btn btn-primary mt-2">
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
            <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
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
                        <p><strong>Description:</strong> {selectedClass.description}</p>
                        <p><strong>Instructor:</strong> {selectedClass.instructor_name}</p>
                        <p><strong>Schedule:</strong> {selectedClass.schedule}</p>
                      </div>
                      <div className="col-md-6">
                        <h6>Statistics</h6>
                        <p><strong>Enrolled Students:</strong> {selectedClass.enrolled_students}</p>
                        <p><strong>Sections:</strong> {selectedClass.sections}</p>
                        <p><strong>Status:</strong> 
                          <span className={`badge ms-2 ${
                            selectedClass.status === 'active' ? 'bg-success' : 
                            selectedClass.status === 'upcoming' ? 'bg-warning' : 'bg-secondary'
                          }`}>
                            {selectedClass.status}
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
                    <button className="btn btn-primary">
                      <i className="fas fa-edit me-2"></i>
                      Edit Class
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
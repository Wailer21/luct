import React, { useEffect, useState } from 'react';
import { useAuth } from '../utils/auth';
import { api, API_ENDPOINTS } from '../utils/api';

export default function Feedback() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await api.get(API_ENDPOINTS.REPORTS, true);
      if (response.success) {
        setReports(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitFeedback = async (reportId) => {
    try {
      const response = await api.post(`${API_ENDPOINTS.REPORTS}/${reportId}/feedback`, {
        feedback,
        feedback_by: user.id
      }, true);
      
      if (response.success) {
        setSelectedReport(null);
        setFeedback('');
        fetchReports();
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  const filteredReports = reports.filter(report =>
    report.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.lecturer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.course_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="container-fluid">
        <div className="d-flex justify-content-center align-items-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading reports...</span>
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
              <h4 className="text-primary mb-1 fw-bold">💬 Feedback Management</h4>
              <p className="text-muted mb-0">Provide feedback on lecture reports</p>
            </div>
            
            <div className="input-group" style={{ width: '300px' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button className="btn btn-outline-primary" type="button">
                <i className="fas fa-search"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      {selectedReport && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add Feedback</h5>
                <button type="button" className="btn-close" onClick={() => setSelectedReport(null)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Your Feedback</label>
                  <textarea
                    className="form-control"
                    rows="4"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Enter your feedback for this report..."
                  ></textarea>
                </div>
                <div className="d-flex gap-2 justify-content-end">
                  <button type="button" className="btn btn-secondary" onClick={() => setSelectedReport(null)}>
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={() => submitFeedback(selectedReport.id)}
                    disabled={!feedback.trim()}
                  >
                    Submit Feedback
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reports Table */}
      <div className="card shadow border-0">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead className="table-light">
                <tr>
                  <th>Report ID</th>
                  <th>Course</th>
                  <th>Lecturer</th>
                  <th>Date</th>
                  <th>Attendance</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map(report => {
                  const attendancePercent = report.actual_present && report.total_registered 
                    ? Math.round((report.actual_present / report.total_registered) * 100)
                    : 0;
                  
                  return (
                    <tr key={report.id}>
                      <td>
                        <strong className="text-primary">LR-{report.id.toString().padStart(6, '0')}</strong>
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
                        {new Date(report.lecture_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td>
                        <span className={`badge ${
                          attendancePercent >= 80 ? 'bg-success' : 
                          attendancePercent >= 60 ? 'bg-warning' : 'bg-danger'
                        }`}>
                          {attendancePercent}%
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-success">Submitted</span>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => {
                            setSelectedReport(report);
                            setFeedback(report.feedback || '');
                          }}
                        >
                          <i className="fas fa-comment me-1"></i>
                          Feedback
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredReports.length === 0 && (
            <div className="text-center py-5">
              <i className="fas fa-clipboard-list fa-4x text-muted mb-3"></i>
              <h5 className="text-muted">No reports found</h5>
              <p className="text-muted">Try adjusting your search terms</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/auth';
import { apiMethods } from '../utils/api';

export default function LecturerFeedback() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);

  const { user } = useAuth();

  useEffect(() => {
    fetchMyReports();
  }, []);

  const fetchMyReports = async () => {
    try {
      const response = await apiMethods.getMyReports();
      if (response.success) {
        setReports(response.data);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const FeedbackDetailModal = ({ report, onClose }) => (
    <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header bg-info text-white">
            <h5 className="modal-title">
              <i className="fas fa-comments me-2"></i>
              PRL Feedback Details
            </h5>
            <button 
              type="button" 
              className="btn-close btn-close-white"
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body">
            <div className="row mb-4">
              <div className="col-md-6">
                <h6>Report Details</h6>
                <p><strong>Class:</strong> {report.class_name}</p>
                <p><strong>Course:</strong> {report.course_name}</p>
                <p><strong>Week:</strong> {report.week_of_reporting}</p>
              </div>
              <div className="col-md-6">
                <h6>Attendance</h6>
                <p><strong>Present:</strong> {report.actual_present}</p>
                <p><strong>Registered:</strong> {report.total_registered}</p>
                <p><strong>Attendance Rate:</strong> 
                  <span className="badge bg-info ms-2">
                    {Math.round((report.actual_present / report.total_registered) * 100)}%
                  </span>
                </p>
              </div>
            </div>

            {report.topic && (
              <div className="mb-3">
                <h6>Topic Covered</h6>
                <p className="text-muted">{report.topic}</p>
              </div>
            )}

            {report.learning_outcomes && (
              <div className="mb-3">
                <h6>Learning Outcomes</h6>
                <p className="text-muted">{report.learning_outcomes}</p>
              </div>
            )}

            {report.recommendations && (
              <div className="mb-3">
                <h6>Your Recommendations</h6>
                <p className="text-muted">{report.recommendations}</p>
              </div>
            )}

            {report.feedback ? (
              <div className="alert alert-success">
                <h6>
                  <i className="fas fa-comment-dots me-2"></i>
                  PRL Feedback
                </h6>
                <p className="mb-2 fs-6">{report.feedback}</p>
                <div className="border-top pt-2 mt-2">
                  <small className="text-muted">
                    <strong>Feedback by:</strong> {report.feedback_by_first_name} {report.feedback_by_last_name}
                  </small>
                  <br />
                  <small className="text-muted">
                    <strong>Date:</strong> {new Date(report.feedback_at).toLocaleDateString()} at {new Date(report.feedback_at).toLocaleTimeString()}
                  </small>
                </div>
              </div>
            ) : (
              <div className="alert alert-warning">
                <i className="fas fa-clock me-2"></i>
                No feedback provided yet. The PRL will review your report and provide feedback soon.
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const ReportCard = ({ report }) => (
    <div className="col-md-6 col-lg-4 mb-4">
      <div className="card h-100 shadow-sm">
        <div className="card-header bg-light d-flex justify-content-between align-items-center">
          <strong className="text-primary">{report.class_name}</strong>
          <span className={`badge ${
            report.feedback ? 'bg-success' : 'bg-warning'
          }`}>
            {report.feedback ? 'Feedback Received' : 'Pending Feedback'}
          </span>
        </div>
        <div className="card-body">
          <h6 className="card-title">{report.course_name}</h6>
          <p className="card-text small text-muted mb-2">
            <strong>Week:</strong> {report.week_of_reporting}
          </p>
          
          <div className="row text-center g-2 mb-3">
            <div className="col-6">
              <div className="border rounded p-2">
                <div className="text-primary fw-bold">{report.actual_present}</div>
                <small className="text-muted">Present</small>
              </div>
            </div>
            <div className="col-6">
              <div className="border rounded p-2">
                <div className="text-primary fw-bold">
                  {Math.round((report.actual_present / report.total_registered) * 100)}%
                </div>
                <small className="text-muted">Attendance</small>
              </div>
            </div>
          </div>

          {report.topic && (
            <div className="mb-2">
              <small><strong>Topic:</strong> {report.topic.substring(0, 60)}...</small>
            </div>
          )}

          {report.feedback ? (
            <div className="alert alert-success py-2 mb-2">
              <small>
                <i className="fas fa-comment me-1"></i>
                <strong>PRL Feedback:</strong> {report.feedback.substring(0, 80)}...
              </small>
            </div>
          ) : (
            <div className="alert alert-warning py-2 mb-2">
              <small>
                <i className="fas fa-clock me-1"></i>
                Awaiting PRL feedback
              </small>
            </div>
          )}
        </div>
        <div className="card-footer bg-transparent">
          <button 
            className="btn btn-sm btn-outline-primary w-100"
            onClick={() => setSelectedReport(report)}
          >
            <i className="fas fa-eye me-1"></i>
            View Details
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="text-primary mb-0">
              <i className="fas fa-comments me-2"></i>
              My Feedback from PRL
            </h2>
            <div className="d-flex gap-2">
              <span className="badge bg-primary">
                Total Reports: {reports.length}
              </span>
              <span className="badge bg-success">
                With Feedback: {reports.filter(r => r.feedback).length}
              </span>
              <span className="badge bg-warning">
                Pending: {reports.filter(r => !r.feedback).length}
              </span>
            </div>
          </div>

          <div className="row mb-4">
            <div className="col-md-3">
              <div className="card bg-primary text-white">
                <div className="card-body text-center">
                  <h3 className="mb-0">{reports.length}</h3>
                  <p className="mb-0">My Reports</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-success text-white">
                <div className="card-body text-center">
                  <h3 className="mb-0">
                    {reports.filter(r => r.feedback).length}
                  </h3>
                  <p className="mb-0">Feedback Received</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-warning text-white">
                <div className="card-body text-center">
                  <h3 className="mb-0">
                    {reports.filter(r => !r.feedback).length}
                  </h3>
                  <p className="mb-0">Awaiting Feedback</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-info text-white">
                <div className="card-body text-center">
                  <h3 className="mb-0">
                    {reports.length > 0 ? 
                      Math.round((reports.filter(r => r.feedback).length / reports.length) * 100) : 0
                    }%
                  </h3>
                  <p className="mb-0">Feedback Rate</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card shadow">
            <div className="card-header bg-light">
              <h5 className="mb-0">
                <i className="fas fa-list me-2"></i>
                My Lecture Reports & PRL Feedback
              </h5>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary"></div>
                  <p className="mt-2">Loading your reports...</p>
                </div>
              ) : reports.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-file-alt fa-3x text-muted mb-3"></i>
                  <h5 className="text-muted">No reports submitted yet</h5>
                  <p className="text-muted">Submit your lecture reports to receive feedback from PRL</p>
                </div>
              ) : (
                <div className="row">
                  {reports.map((report) => (
                    <ReportCard key={report.id} report={report} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {selectedReport && (
            <FeedbackDetailModal 
              report={selectedReport} 
              onClose={() => setSelectedReport(null)} 
            />
          )}
        </div>
      </div>
    </div>
  );
}
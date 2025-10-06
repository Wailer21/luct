import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/auth';
import { apiMethods } from '../utils/api';

export default function PRLReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await apiMethods.getReports();
      if (response.success) {
        setReports(response.data);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitFeedback = async (reportId) => {
    if (!feedback.trim()) {
      alert('Please enter feedback before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await apiMethods.submitFeedback(reportId, feedback);
      if (response.success) {
        alert('Feedback submitted successfully!');
        setFeedback('');
        setSelectedReport(null);
        fetchReports();
      } else {
        alert('Failed to submit feedback: ' + response.message);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Error submitting feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const FeedbackModal = ({ report, onClose }) => (
    <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">
              <i className="fas fa-comment me-2"></i>
              Provide Feedback for Report
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
                <h6>Lecturer Recommendations</h6>
                <p className="text-muted">{report.recommendations}</p>
              </div>
            )}

            {report.feedback && (
              <div className="alert alert-info">
                <h6>
                  <i className="fas fa-history me-2"></i>
                  Previous Feedback
                </h6>
                <p className="mb-1">{report.feedback}</p>
                <small className="text-muted">
                  By: {report.feedback_by_first_name} {report.feedback_by_last_name} 
                  {report.feedback_at && ` on ${new Date(report.feedback_at).toLocaleDateString()}`}
                </small>
              </div>
            )}

            <div className="mb-3">
              <label htmlFor="feedback" className="form-label">
                <strong>Your Feedback</strong>
              </label>
              <textarea
                id="feedback"
                className="form-control"
                rows="4"
                placeholder="Provide constructive feedback for the lecturer..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
              <div className="form-text">
                Provide specific, actionable feedback to help improve teaching quality.
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              type="button" 
              className="btn btn-primary"
              onClick={() => submitFeedback(report.id)}
              disabled={submitting || !feedback.trim()}
            >
              {submitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Submitting...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane me-2"></i>
                  Submit Feedback
                </>
              )}
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
            {report.feedback ? 'Feedback Provided' : 'Needs Feedback'}
          </span>
        </div>
        <div className="card-body">
          <h6 className="card-title">{report.course_name}</h6>
          <p className="card-text small text-muted mb-2">
            <strong>Lecturer:</strong> {report.lecturer_name}
          </p>
          
          <div className="row text-center g-2 mb-3">
            <div className="col-6">
              <div className="border rounded p-2">
                <div className="text-primary fw-bold">Week {report.week_of_reporting}</div>
                <small className="text-muted">Reporting Week</small>
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
              <small><strong>Topic:</strong> {report.topic.substring(0, 50)}...</small>
            </div>
          )}

          {report.feedback && (
            <div className="alert alert-success py-2 mb-2">
              <small>
                <i className="fas fa-check-circle me-1"></i>
                <strong>Your Feedback:</strong> {report.feedback.substring(0, 60)}...
              </small>
            </div>
          )}
        </div>
        <div className="card-footer bg-transparent">
          <div className="btn-group w-100">
            <button 
              className="btn btn-sm btn-outline-primary"
              onClick={() => setSelectedReport(report)}
            >
              <i className="fas fa-eye me-1"></i>
              {report.feedback ? 'View/Edit' : 'Provide'} Feedback
            </button>
            <button className="btn btn-sm btn-outline-info">
              <i className="fas fa-chart-bar"></i>
            </button>
          </div>
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
              <i className="fas fa-file-alt me-2"></i>
              PRL Reports & Feedback
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
                  <p className="mb-0">Total Reports</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-success text-white">
                <div className="card-body text-center">
                  <h3 className="mb-0">
                    {reports.filter(r => r.feedback).length}
                  </h3>
                  <p className="mb-0">Feedback Provided</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-warning text-white">
                <div className="card-body text-center">
                  <h3 className="mb-0">
                    {reports.filter(r => !r.feedback).length}
                  </h3>
                  <p className="mb-0">Pending Feedback</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-info text-white">
                <div className="card-body text-center">
                  <h3 className="mb-0">
                    {new Set(reports.map(r => r.lecturer_id)).size}
                  </h3>
                  <p className="mb-0">Lecturers</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card shadow">
            <div className="card-header bg-light d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="fas fa-list me-2"></i>
                Lecturer Reports
              </h5>
              <div className="btn-group">
                <button className="btn btn-sm btn-outline-primary active">
                  All Reports
                </button>
                <button className="btn btn-sm btn-outline-warning">
                  Needs Feedback
                </button>
                <button className="btn btn-sm btn-outline-success">
                  With Feedback
                </button>
              </div>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary"></div>
                  <p className="mt-2">Loading reports...</p>
                </div>
              ) : reports.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-file-alt fa-3x text-muted mb-3"></i>
                  <h5 className="text-muted">No reports available</h5>
                  <p className="text-muted">Reports will appear here once lecturers submit them</p>
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
            <FeedbackModal 
              report={selectedReport} 
              onClose={() => {
                setSelectedReport(null);
                setFeedback('');
              }} 
            />
          )}
        </div>
      </div>
    </div>
  );
}
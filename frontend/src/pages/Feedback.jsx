import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/auth';
import { apiMethods } from '../utils/api';

export default function Feedback() {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await apiMethods.getReports();
      if (response.success) {
        setReports(response.data.reports || response.data);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFeedback = async (reportId) => {
    if (!feedback.trim()) return;

    setSubmitting(true);
    try {
      const response = await apiMethods.submitFeedback(reportId, feedback);
      if (response.success) {
        setFeedback('');
        setSelectedReport(null);
        fetchReports(); // Refresh to show the feedback
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (!['PRL', 'PL', 'Admin'].includes(user?.role)) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-danger">
          <i className="fas fa-exclamation-triangle me-2"></i>
          Access denied. Feedback requires PRL, PL, or Admin role.
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <h2 className="text-primary mb-4">
            <i className="fas fa-comments me-2"></i>
            Provide Feedback
          </h2>

          <div className="card shadow">
            <div className="card-header bg-white">
              <h5 className="mb-0">Lecture Reports Pending Feedback</h5>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary"></div>
                  <p className="mt-2">Loading reports...</p>
                </div>
              ) : reports.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-clipboard-list fa-3x text-muted mb-3"></i>
                  <h5 className="text-muted">No reports available</h5>
                </div>
              ) : (
                <div className="list-group">
                  {reports.map((report) => (
                    <div key={report.id} className="list-group-item">
                      <div className="row align-items-center">
                        <div className="col-md-8">
                          <h6 className="mb-1">{report.course_name} ({report.course_code})</h6>
                          <p className="mb-1 text-muted">
                            <small>
                              Lecturer: {report.lecturer_name} | 
                              Week {report.week_of_reporting} | 
                              Date: {new Date(report.lecture_date).toLocaleDateString()}
                            </small>
                          </p>
                          <p className="mb-1">
                            <small>
                              Attendance: {report.actual_present}/{report.total_registered} 
                              ({Math.round((report.actual_present / report.total_registered) * 100)}%)
                            </small>
                          </p>
                          {report.topic && (
                            <p className="mb-1">
                              <small>Topic: {report.topic}</small>
                            </p>
                          )}
                        </div>
                        <div className="col-md-4 text-end">
                          {report.feedback ? (
                            <div className="alert alert-info py-2">
                              <small>
                                <strong>Your Feedback:</strong> {report.feedback}
                              </small>
                            </div>
                          ) : (
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => setSelectedReport(report.id)}
                            >
                              <i className="fas fa-comment me-1"></i>
                              Provide Feedback
                            </button>
                          )}
                        </div>
                      </div>

                      {selectedReport === report.id && (
                        <div className="mt-3 p-3 bg-light rounded">
                          <div className="mb-2">
                            <label className="form-label">
                              <strong>Your Feedback:</strong>
                            </label>
                            <textarea
                              className="form-control"
                              rows="3"
                              value={feedback}
                              onChange={(e) => setFeedback(e.target.value)}
                              placeholder="Enter your constructive feedback for this lecture report..."
                            ></textarea>
                          </div>
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => handleSubmitFeedback(report.id)}
                              disabled={submitting || !feedback.trim()}
                            >
                              {submitting ? (
                                <>
                                  <div className="spinner-border spinner-border-sm me-1"></div>
                                  Submitting...
                                </>
                              ) : (
                                <>
                                  <i className="fas fa-check me-1"></i>
                                  Submit Feedback
                                </>
                              )}
                            </button>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => {
                                setSelectedReport(null);
                                setFeedback('');
                              }}
                              disabled={submitting}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
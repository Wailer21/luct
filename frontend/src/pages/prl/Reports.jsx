"use client"

import { useEffect, useState } from "react"
import { useAuth } from "../../utils/auth"
import { apiMethods, API_ENDPOINTS } from "../../utils/api"

export default function PRLReports() {
  const { token } = useAuth()
  const [reports, setReports] = useState([])
  const [selectedReport, setSelectedReport] = useState(null)
  const [feedback, setFeedback] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!token) return
    fetchReports()
  }, [token])

  const fetchReports = async () => {
    try {
      const res = await apiMethods.get(API_ENDPOINTS.REPORTS)

      if (res.success) {
        setReports(res.data.reports || [])
      }
    } catch (err) {
      console.error("Failed to fetch reports:", err)
    } finally {
      setLoading(false)
    }
  }

  const fetchReportDetails = async (reportId) => {
    try {
      const [reportRes, feedbackRes] = await Promise.all([
        apiMethods.get(`${API_ENDPOINTS.REPORTS}/${reportId}`),
        apiMethods.get(`${API_ENDPOINTS.REPORTS}/${reportId}/feedback`),
      ])

      if (reportRes.success) {
        setSelectedReport({
          ...reportRes.data,
          feedback: feedbackRes.success ? feedbackRes.data : [],
        })
      }
    } catch (err) {
      console.error("Failed to fetch report details:", err)
    }
  }

  const handleSubmitFeedback = async (e) => {
    e.preventDefault()
    if (!feedback.trim() || !selectedReport) return

    try {
      setSubmitting(true)
      const res = await apiMethods.post(
        `${API_ENDPOINTS.REPORTS}/${selectedReport.id}/feedback`,
        { feedback }
      )

      if (res.success) {
        setFeedback("")
        fetchReportDetails(selectedReport.id)
        alert("Feedback submitted successfully")
      }
    } catch (err) {
      console.error("Failed to submit feedback:", err)
      alert("Failed to submit feedback")
    } finally {
      setSubmitting(false)
    }
  }

  const getAttendanceColor = (percentage) => {
    if (percentage >= 80) return "success"
    if (percentage >= 60) return "warning"
    return "danger"
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading reports...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container-fluid py-4">
      <div className="row mb-4">
        <div className="col-12">
          <h4 className="text-primary mb-1">Lecture Reports Review</h4>
          <p className="text-muted mb-0">View lecture reports and provide feedback</p>
        </div>
      </div>

      <div className="row">
        {/* Reports List */}
        <div className="col-md-5 mb-4">
          <div className="card shadow">
            <div className="card-header bg-primary text-white">
              <h6 className="mb-0">All Reports ({reports.length})</h6>
            </div>
            <div className="card-body p-0" style={{ maxHeight: "600px", overflowY: "auto" }}>
              {reports.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-clipboard-list fa-3x text-muted mb-3"></i>
                  <h5 className="text-muted">No reports found</h5>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {reports.map((report) => {
                    const attendancePercent =
                      report.actual_present && report.total_registered
                        ? Math.round((report.actual_present / report.total_registered) * 100)
                        : 0
                    const color = getAttendanceColor(attendancePercent)

                    return (
                      <button
                        key={report.id}
                        className={`list-group-item list-group-item-action ${
                          selectedReport?.id === report.id ? "active" : ""
                        }`}
                        onClick={() => fetchReportDetails(report.id)}
                      >
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <h6 className="mb-1">{report.course_name}</h6>
                            <small className={selectedReport?.id === report.id ? "text-white-50" : "text-muted"}>
                              {report.course_code} - Week {report.week_of_reporting}
                            </small>
                          </div>
                          <span
                            className={`badge bg-${selectedReport?.id === report.id ? "light text-primary" : color}`}
                          >
                            {attendancePercent}%
                          </span>
                        </div>
                        <div className="d-flex justify-content-between">
                          <small className={selectedReport?.id === report.id ? "text-white-50" : "text-muted"}>
                            <i className="fas fa-user me-1"></i>
                            {report.lecturer_name}
                          </small>
                          <small className={selectedReport?.id === report.id ? "text-white-50" : "text-muted"}>
                            {new Date(report.lecture_date).toLocaleDateString()}
                          </small>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Report Details */}
        <div className="col-md-7 mb-4">
          {selectedReport ? (
            <>
              <div className="card shadow mb-4">
                <div className="card-header bg-white">
                  <h6 className="mb-0 text-primary">Report Details</h6>
                </div>
                <div className="card-body">
                  <div className="row mb-3">
                    <div className="col-md-6 mb-3">
                      <strong className="text-primary">Course:</strong>
                      <p className="mb-0">{selectedReport.course_name}</p>
                      <small className="text-muted">{selectedReport.course_code}</small>
                    </div>
                    <div className="col-md-6 mb-3">
                      <strong className="text-primary">Lecturer:</strong>
                      <p className="mb-0">{selectedReport.lecturer_name}</p>
                    </div>
                    <div className="col-md-6 mb-3">
                      <strong className="text-primary">Class:</strong>
                      <p className="mb-0">{selectedReport.class_name}</p>
                    </div>
                    <div className="col-md-6 mb-3">
                      <strong className="text-primary">Date:</strong>
                      <p className="mb-0">{new Date(selectedReport.lecture_date).toLocaleDateString()}</p>
                    </div>
                    <div className="col-md-6 mb-3">
                      <strong className="text-primary">Venue:</strong>
                      <p className="mb-0">{selectedReport.venue}</p>
                    </div>
                    <div className="col-md-6 mb-3">
                      <strong className="text-primary">Time:</strong>
                      <p className="mb-0">{selectedReport.scheduled_time}</p>
                    </div>
                    <div className="col-md-6 mb-3">
                      <strong className="text-primary">Attendance:</strong>
                      <p className="mb-0">
                        {selectedReport.actual_present} / {selectedReport.total_registered}
                        <span
                          className={`badge bg-${getAttendanceColor(
                            Math.round((selectedReport.actual_present / selectedReport.total_registered) * 100),
                          )} ms-2`}
                        >
                          {Math.round((selectedReport.actual_present / selectedReport.total_registered) * 100)}%
                        </span>
                      </p>
                    </div>
                    <div className="col-md-6 mb-3">
                      <strong className="text-primary">Week:</strong>
                      <p className="mb-0">Week {selectedReport.week_of_reporting}</p>
                    </div>
                  </div>

                  <div className="mb-3">
                    <strong className="text-primary">Topic Taught:</strong>
                    <p className="mb-0">{selectedReport.topic || "Not specified"}</p>
                  </div>

                  <div className="mb-3">
                    <strong className="text-primary">Learning Outcomes:</strong>
                    <p className="mb-0">{selectedReport.learning_outcomes || "Not specified"}</p>
                  </div>

                  <div className="mb-0">
                    <strong className="text-primary">Recommendations:</strong>
                    <p className="mb-0">{selectedReport.recommendations || "None"}</p>
                  </div>
                </div>
              </div>

              {/* Feedback Section */}
              <div className="card shadow">
                <div className="card-header bg-white">
                  <h6 className="mb-0 text-primary">Feedback</h6>
                </div>
                <div className="card-body">
                  {/* Existing Feedback */}
                  {selectedReport.feedback && selectedReport.feedback.length > 0 && (
                    <div className="mb-4">
                      <h6 className="text-muted mb-3">Previous Feedback</h6>
                      {selectedReport.feedback.map((fb, index) => (
                        <div key={index} className="alert alert-info">
                          <div className="d-flex justify-content-between mb-2">
                            <strong>{fb.reviewer_name}</strong>
                            <small className="text-muted">{new Date(fb.created_at).toLocaleDateString()}</small>
                          </div>
                          <p className="mb-0">{fb.feedback}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Feedback Form */}
                  <form onSubmit={handleSubmitFeedback}>
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Add Your Feedback</label>
                      <textarea
                        className="form-control"
                        rows="4"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Provide constructive feedback on this lecture report..."
                        required
                      ></textarea>
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={submitting || !feedback.trim()}>
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
                  </form>
                </div>
              </div>
            </>
          ) : (
            <div className="card shadow">
              <div className="card-body text-center py-5">
                <i className="fas fa-hand-pointer fa-3x text-muted mb-3"></i>
                <h5 className="text-muted">Select a report</h5>
                <p className="text-muted">Click on a report from the list to view details and add feedback</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
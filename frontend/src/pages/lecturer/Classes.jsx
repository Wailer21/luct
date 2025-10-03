"use client"

import { useEffect, useState } from "react"
import { useAuth } from "../../utils/auth"
import { Link } from "react-router-dom"
import { apiMethods, API_ENDPOINTS } from "../../utils/api"

export default function LecturerClasses() {
  const { token } = useAuth()
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!token) return
    fetchClasses()
  }, [token])

  const fetchClasses = async () => {
    try {
      const res = await apiMethods.get(API_ENDPOINTS.MY_CLASSES)

      if (res.success) {
        setClasses(res.data || [])
      }
    } catch (err) {
      setError("Failed to load classes")
      console.error("Fetch classes error:", err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading classes...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container-fluid py-4">
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h4 className="text-primary mb-1">My Classes</h4>
              <p className="text-muted mb-0">View and manage your assigned classes</p>
            </div>
            <Link to="/report" className="btn btn-primary">
              <i className="fas fa-plus me-2"></i>
              New Report
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {classes.length === 0 ? (
        <div className="card shadow">
          <div className="card-body text-center py-5">
            <i className="fas fa-chalkboard-teacher fa-3x text-muted mb-3"></i>
            <h5 className="text-muted">No classes assigned</h5>
            <p className="text-muted">You don't have any classes assigned yet.</p>
          </div>
        </div>
      ) : (
        <div className="row">
          {classes.map((classItem) => (
            <div key={classItem.id} className="col-md-6 col-lg-4 mb-4">
              <div className="card shadow-sm h-100 hover-shadow">
                <div className="card-header bg-primary text-white">
                  <h6 className="mb-0">{classItem.class_name}</h6>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <strong className="text-primary">Course:</strong>
                    <p className="mb-1">{classItem.course_name}</p>
                    <small className="text-muted">{classItem.course_code}</small>
                  </div>

                  <div className="mb-3">
                    <strong className="text-primary">Faculty:</strong>
                    <p className="mb-0">{classItem.faculty_name}</p>
                  </div>

                  <div className="mb-3">
                    <strong className="text-primary">Venue:</strong>
                    <p className="mb-0">{classItem.venue || "Not specified"}</p>
                  </div>

                  <div className="mb-3">
                    <strong className="text-primary">Schedule:</strong>
                    <p className="mb-0">{classItem.scheduled_time || "Not specified"}</p>
                  </div>

                  <div className="mb-3">
                    <strong className="text-primary">Total Students:</strong>
                    <p className="mb-0">
                      <span className="badge bg-info">{classItem.total_registered || 0}</span>
                    </p>
                  </div>
                </div>
                <div className="card-footer bg-white">
                  <Link to="/report" state={{ classId: classItem.id }} className="btn btn-sm btn-primary w-100">
                    <i className="fas fa-plus-circle me-2"></i>
                    Create Report
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
"use client"

import { useEffect, useState } from "react"
import { useAuth } from "../../utils/auth"
import { apiMethods, API_ENDPOINTS } from "../../utils/api"

export default function PRLCourses() {
  const { token } = useAuth()
  const [courses, setCourses] = useState([])
  const [classes, setClasses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!token) return
    fetchCourses()
  }, [token])

  const fetchCourses = async () => {
    try {
      const res = await apiMethods.get(API_ENDPOINTS.COURSES)

      if (res.success) {
        setCourses(res.data || [])
      }
    } catch (err) {
      setError("Failed to load courses")
      console.error("Fetch courses error:", err)
    } finally {
      setLoading(false)
    }
  }

  const fetchClassesForCourse = async (courseId) => {
    try {
      const res = await apiMethods.get(`${API_ENDPOINTS.CLASSES}?course_id=${courseId}`)

      if (res.success) {
        setClasses(res.data || [])
      }
    } catch (err) {
      console.error("Fetch classes error:", err)
    }
  }

  const handleCourseClick = (course) => {
    setSelectedCourse(course)
    fetchClassesForCourse(course.id)
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading courses...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container-fluid py-4">
      <div className="row mb-4">
        <div className="col-12">
          <h4 className="text-primary mb-1">Courses Management</h4>
          <p className="text-muted mb-0">View all courses and lectures under your stream</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="row">
        {/* Courses List */}
        <div className="col-md-5 mb-4">
          <div className="card shadow">
            <div className="card-header bg-primary text-white">
              <h6 className="mb-0">All Courses</h6>
            </div>
            <div className="card-body p-0">
              {courses.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-book fa-3x text-muted mb-3"></i>
                  <h5 className="text-muted">No courses found</h5>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {courses.map((course) => (
                    <button
                      key={course.id}
                      className={`list-group-item list-group-item-action ${
                        selectedCourse?.id === course.id ? "active" : ""
                      }`}
                      onClick={() => handleCourseClick(course)}
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h6 className="mb-1">{course.course_name}</h6>
                          <small className={selectedCourse?.id === course.id ? "text-white-50" : "text-muted"}>
                            {course.course_code}
                          </small>
                        </div>
                        <span
                          className={`badge ${selectedCourse?.id === course.id ? "bg-light text-primary" : "bg-primary"}`}
                        >
                          {course.total_registered} students
                        </span>
                      </div>
                      <div className="mt-2">
                        <small className={selectedCourse?.id === course.id ? "text-white-50" : "text-muted"}>
                          <i className="fas fa-building me-1"></i>
                          {course.faculty_name}
                        </small>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Course Details & Classes */}
        <div className="col-md-7 mb-4">
          {selectedCourse ? (
            <>
              <div className="card shadow mb-4">
                <div className="card-header bg-white">
                  <h6 className="mb-0 text-primary">Course Details</h6>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <strong className="text-primary">Course Name:</strong>
                      <p className="mb-0">{selectedCourse.course_name}</p>
                    </div>
                    <div className="col-md-6 mb-3">
                      <strong className="text-primary">Course Code:</strong>
                      <p className="mb-0">{selectedCourse.course_code}</p>
                    </div>
                    <div className="col-md-6 mb-3">
                      <strong className="text-primary">Faculty:</strong>
                      <p className="mb-0">{selectedCourse.faculty_name}</p>
                    </div>
                    <div className="col-md-6 mb-3">
                      <strong className="text-primary">Total Registered:</strong>
                      <p className="mb-0">
                        <span className="badge bg-info">{selectedCourse.total_registered}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card shadow">
                <div className="card-header bg-white">
                  <h6 className="mb-0 text-primary">Classes & Lectures</h6>
                </div>
                <div className="card-body">
                  {classes.length === 0 ? (
                    <div className="text-center py-4">
                      <i className="fas fa-chalkboard-teacher fa-2x text-muted mb-3"></i>
                      <p className="text-muted mb-0">No classes scheduled for this course</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead className="table-light">
                          <tr>
                            <th>Class Name</th>
                            <th>Lecturer</th>
                            <th>Venue</th>
                            <th>Schedule</th>
                          </tr>
                        </thead>
                        <tbody>
                          {classes.map((classItem) => (
                            <tr key={classItem.id}>
                              <td>
                                <strong>{classItem.class_name}</strong>
                              </td>
                              <td>{classItem.lecturer_name || "Not assigned"}</td>
                              <td>{classItem.venue || "TBA"}</td>
                              <td>
                                <small className="text-muted">{classItem.scheduled_time || "TBA"}</small>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="card shadow">
              <div className="card-body text-center py-5">
                <i className="fas fa-hand-pointer fa-3x text-muted mb-3"></i>
                <h5 className="text-muted">Select a course</h5>
                <p className="text-muted">Click on a course from the list to view details and classes</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
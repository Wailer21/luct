"use client"

import { useEffect, useState } from "react"
import { useAuth } from "../../utils/auth"
import { apiMethods, API_ENDPOINTS } from "../../utils/api"

export default function PRLClasses() {
  const { token } = useAuth()
  const [classes, setClasses] = useState([])
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    fetchData()
  }, [token])

  const fetchData = async () => {
    try {
      const [classesRes, coursesRes] = await Promise.all([
        apiMethods.get(API_ENDPOINTS.CLASSES),
        apiMethods.get(API_ENDPOINTS.COURSES),
      ])

      if (classesRes.success) {
        setClasses(classesRes.data || [])
      }

      if (coursesRes.success) {
        setCourses(coursesRes.data || [])
      }
    } catch (err) {
      console.error("Failed to fetch data:", err)
    } finally {
      setLoading(false)
    }
  }

  const filteredClasses = selectedCourse
    ? classes.filter((c) => c.course_id === Number.parseInt(selectedCourse))
    : classes

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
              <h4 className="text-primary mb-1">All Classes</h4>
              <p className="text-muted mb-0">View all scheduled classes across courses</p>
            </div>
            <div style={{ minWidth: "250px" }}>
              <select
                className="form-select"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
              >
                <option value="">All Courses</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.course_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {filteredClasses.length === 0 ? (
        <div className="card shadow">
          <div className="card-body text-center py-5">
            <i className="fas fa-chalkboard-teacher fa-3x text-muted mb-3"></i>
            <h5 className="text-muted">No classes found</h5>
            <p className="text-muted">
              {selectedCourse ? "No classes for the selected course" : "No classes have been scheduled yet"}
            </p>
          </div>
        </div>
      ) : (
        <div className="row">
          {filteredClasses.map((classItem) => (
            <div key={classItem.id} className="col-md-6 col-lg-4 mb-4">
              <div className="card shadow-sm h-100">
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
                    <strong className="text-primary">Lecturer:</strong>
                    <p className="mb-0">{classItem.lecturer_name || "Not assigned"}</p>
                  </div>

                  <div className="mb-3">
                    <strong className="text-primary">Venue:</strong>
                    <p className="mb-0">{classItem.venue || "Not specified"}</p>
                  </div>

                  <div className="mb-3">
                    <strong className="text-primary">Schedule:</strong>
                    <p className="mb-0">{classItem.scheduled_time || "Not specified"}</p>
                  </div>

                  <div className="mb-0">
                    <strong className="text-primary">Total Students:</strong>
                    <p className="mb-0">
                      <span className="badge bg-info">{classItem.total_registered || 0}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
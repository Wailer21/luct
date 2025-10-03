"use client"

import { useEffect, useState } from "react"
import { useAuth } from "../../utils/auth"
import { apiMethods, API_ENDPOINTS } from "../../utils/api"

export default function PLCourses() {
  const { token } = useAuth()
  const [courses, setCourses] = useState([])
  const [faculties, setFaculties] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    faculty_id: "",
    total_registered: 0,
  })

  useEffect(() => {
    if (!token) return
    fetchData()
  }, [token])

  const fetchData = async () => {
    try {
      const [coursesRes, facultiesRes] = await Promise.all([
        apiMethods.get(API_ENDPOINTS.COURSES),
        apiMethods.get(API_ENDPOINTS.FACULTIES),
      ])

      if (coursesRes.success) {
        setCourses(coursesRes.data || [])
      }

      if (facultiesRes.success) {
        setFaculties(facultiesRes.data || [])
      }
    } catch (err) {
      console.error("Failed to fetch data:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (course = null) => {
    if (course) {
      setEditingCourse(course)
      setFormData({
        name: course.course_name,
        code: course.course_code,
        faculty_id: course.faculty_id,
        total_registered: course.total_registered,
      })
    } else {
      setEditingCourse(null)
      setFormData({
        name: "",
        code: "",
        faculty_id: "",
        total_registered: 0,
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingCourse(null)
    setFormData({
      name: "",
      code: "",
      faculty_id: "",
      total_registered: 0,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      if (editingCourse) {
        // Update existing course
        await apiMethods.put(`${API_ENDPOINTS.COURSES}/${editingCourse.id}`, formData)
        alert("Course updated successfully")
      } else {
        // Create new course
        await apiMethods.post(API_ENDPOINTS.COURSES, formData)
        alert("Course created successfully")
      }

      handleCloseModal()
      fetchData()
    } catch (err) {
      console.error("Failed to save course:", err)
      alert("Failed to save course")
    }
  }

  const handleDelete = async (courseId) => {
    if (!window.confirm("Are you sure you want to delete this course?")) {
      return
    }

    try {
      await apiMethods.delete(`${API_ENDPOINTS.COURSES}/${courseId}`)
      alert("Course deleted successfully")
      fetchData()
    } catch (err) {
      console.error("Failed to delete course:", err)
      alert("Failed to delete course")
    }
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
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h4 className="text-primary mb-1">Course Management</h4>
              <p className="text-muted mb-0">Manage all courses in the system</p>
            </div>
            <button className="btn btn-primary" onClick={() => handleOpenModal()}>
              <i className="fas fa-plus me-2"></i>
              Add New Course
            </button>
          </div>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="card shadow">
          <div className="card-body text-center py-5">
            <i className="fas fa-book fa-3x text-muted mb-3"></i>
            <h5 className="text-muted">No courses found</h5>
            <p className="text-muted">Click "Add New Course" to create your first course</p>
          </div>
        </div>
      ) : (
        <div className="card shadow">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="table-light">
                  <tr>
                    <th>Course Code</th>
                    <th>Course Name</th>
                    <th>Faculty</th>
                    <th>Total Registered</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course) => (
                    <tr key={course.id}>
                      <td>
                        <strong>{course.course_code}</strong>
                      </td>
                      <td>{course.course_name}</td>
                      <td>{course.faculty_name}</td>
                      <td>
                        <span className="badge bg-info">{course.total_registered}</span>
                      </td>
                      <td>
                        <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleOpenModal(course)}>
                          <i className="fas fa-edit"></i>
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(course.id)}>
                          <i className="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Add/Edit Course */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editingCourse ? "Edit Course" : "Add New Course"}</h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Course Code *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Course Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Faculty *</label>
                    <select
                      className="form-select"
                      value={formData.faculty_id}
                      onChange={(e) => setFormData({ ...formData, faculty_id: e.target.value })}
                      required
                    >
                      <option value="">Select Faculty</option>
                      {faculties.map((faculty) => (
                        <option key={faculty.id} value={faculty.id}>
                          {faculty.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Total Registered Students *</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.total_registered}
                      onChange={(e) => setFormData({ ...formData, total_registered: e.target.value })}
                      min="0"
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingCourse ? "Update Course" : "Create Course"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
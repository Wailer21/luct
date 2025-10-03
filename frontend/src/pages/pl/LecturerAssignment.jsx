"use client"

import { useEffect, useState } from "react"
import { useAuth } from "../../utils/auth"
import { apiMethods, API_ENDPOINTS } from "../../utils/api"

export default function LecturerAssignment() {
  const { token } = useAuth()
  const [classes, setClasses] = useState([])
  const [lecturers, setLecturers] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCourse, setSelectedCourse] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [editingClass, setEditingClass] = useState(null)
  const [formData, setFormData] = useState({
    class_name: "",
    course_id: "",
    lecturer_id: "",
    venue: "",
    scheduled_time: "",
  })

  useEffect(() => {
    if (!token) return
    fetchData()
  }, [token])

  const fetchData = async () => {
    try {
      const [classesRes, lecturersRes, coursesRes] = await Promise.all([
        apiMethods.get(API_ENDPOINTS.CLASSES),
        apiMethods.get(API_ENDPOINTS.LECTURERS),
        apiMethods.get(API_ENDPOINTS.COURSES),
      ])

      if (classesRes.success) {
        setClasses(classesRes.data || [])
      }

      if (lecturersRes.success) {
        setLecturers(lecturersRes.data || [])
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

  const handleOpenModal = (classItem = null) => {
    if (classItem) {
      setEditingClass(classItem)
      setFormData({
        class_name: classItem.class_name,
        course_id: classItem.course_id,
        lecturer_id: classItem.lecturer_id || "",
        venue: classItem.venue || "",
        scheduled_time: classItem.scheduled_time || "",
      })
    } else {
      setEditingClass(null)
      setFormData({
        class_name: "",
        course_id: "",
        lecturer_id: "",
        venue: "",
        scheduled_time: "",
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingClass(null)
    setFormData({
      class_name: "",
      course_id: "",
      lecturer_id: "",
      venue: "",
      scheduled_time: "",
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      if (editingClass) {
        // Update existing class
        await apiMethods.put(`${API_ENDPOINTS.CLASSES}/${editingClass.id}`, formData)
        alert("Class updated successfully")
      } else {
        // Create new class
        await apiMethods.post(API_ENDPOINTS.CLASSES, formData)
        alert("Class created successfully")
      }

      handleCloseModal()
      fetchData()
    } catch (err) {
      console.error("Failed to save class:", err)
      alert("Failed to save class")
    }
  }

  const handleDelete = async (classId) => {
    if (!window.confirm("Are you sure you want to delete this class?")) {
      return
    }

    try {
      await apiMethods.delete(`${API_ENDPOINTS.CLASSES}/${classId}`)
      alert("Class deleted successfully")
      fetchData()
    } catch (err) {
      console.error("Failed to delete class:", err)
      alert("Failed to delete class")
    }
  }

  const filteredClasses = selectedCourse
    ? classes.filter((c) => c.course_id === Number.parseInt(selectedCourse))
    : classes

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container-fluid py-4">
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h4 className="text-primary mb-1">Lecturer Assignment</h4>
              <p className="text-muted mb-0">Assign lecturers to classes and manage schedules</p>
            </div>
            <div className="d-flex gap-2 align-items-center">
              <select
                className="form-select"
                style={{ minWidth: "200px" }}
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
              <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                <i className="fas fa-plus me-2"></i>
                Add Class
              </button>
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
              {selectedCourse ? "No classes for the selected course" : 'Click "Add Class" to create your first class'}
            </p>
          </div>
        </div>
      ) : (
        <div className="card shadow">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="table-light">
                  <tr>
                    <th>Class Name</th>
                    <th>Course</th>
                    <th>Lecturer</th>
                    <th>Venue</th>
                    <th>Schedule</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClasses.map((classItem) => (
                    <tr key={classItem.id}>
                      <td>
                        <strong>{classItem.class_name}</strong>
                      </td>
                      <td>
                        {classItem.course_name}
                        <br />
                        <small className="text-muted">{classItem.course_code}</small>
                      </td>
                      <td>
                        {classItem.lecturer_name ? (
                          <span className="badge bg-success">
                            <i className="fas fa-user-check me-1"></i>
                            {classItem.lecturer_name}
                          </span>
                        ) : (
                          <span className="badge bg-warning">
                            <i className="fas fa-user-times me-1"></i>
                            Not assigned
                          </span>
                        )}
                      </td>
                      <td>{classItem.venue || <span className="text-muted">Not set</span>}</td>
                      <td>{classItem.scheduled_time || <span className="text-muted">Not set</span>}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary me-2"
                          onClick={() => handleOpenModal(classItem)}
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(classItem.id)}>
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

      {/* Modal for Add/Edit Class */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editingClass ? "Edit Class" : "Add New Class"}</h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Class Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.class_name}
                      onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                      placeholder="e.g., Section A, Group 1"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Course *</label>
                    <select
                      className="form-select"
                      value={formData.course_id}
                      onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                      required
                    >
                      <option value="">Select Course</option>
                      {courses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.course_name} ({course.course_code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Assign Lecturer</label>
                    <select
                      className="form-select"
                      value={formData.lecturer_id}
                      onChange={(e) => setFormData({ ...formData, lecturer_id: e.target.value })}
                    >
                      <option value="">No lecturer assigned</option>
                      {lecturers.map((lecturer) => (
                        <option key={lecturer.id} value={lecturer.id}>
                          {lecturer.first_name} {lecturer.last_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Venue</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.venue}
                      onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                      placeholder="e.g., Room 101, Lab A"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Schedule</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.scheduled_time}
                      onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                      placeholder="e.g., Mon/Wed 10:00-12:00"
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingClass ? "Update Class" : "Create Class"}
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
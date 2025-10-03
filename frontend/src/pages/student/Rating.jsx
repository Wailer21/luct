"use client"

import { useEffect, useState } from "react"
import { useAuth } from "../../utils/auth"
import { apiMethods, API_ENDPOINTS } from "../../utils/api"

export default function StudentRating() {
  const { token, user } = useAuth()
  const [courses, setCourses] = useState([])
  const [lecturers, setLecturers] = useState([])
  const [myRatings, setMyRatings] = useState([])
  const [loading, setLoading] = useState(true)
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState("")
  const [selectedLecturer, setSelectedLecturer] = useState("")
  const [ratingForm, setRatingForm] = useState({
    rating: 0,
    comment: "",
    course_id: "",
    lecturer_id: ""
  })

  useEffect(() => {
    if (!token) return
    fetchData()
  }, [token])

  const fetchData = async () => {
    try {
      const [coursesRes, lecturersRes, ratingsRes] = await Promise.all([
        apiMethods.get(API_ENDPOINTS.COURSES),
        apiMethods.get(API_ENDPOINTS.LECTURERS),
        apiMethods.get(API_ENDPOINTS.RATINGS_MY)
      ])

      if (coursesRes.success) {
        setCourses(coursesRes.data || [])
      }

      if (lecturersRes.success) {
        setLecturers(lecturersRes.data || [])
      }

      if (ratingsRes.success) {
        setMyRatings(ratingsRes.data || [])
      }
    } catch (err) {
      console.error("Failed to fetch data:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenRatingModal = () => {
    setRatingForm({
      rating: 0,
      comment: "",
      course_id: "",
      lecturer_id: ""
    })
    setSelectedCourse("")
    setSelectedLecturer("")
    setShowRatingModal(true)
  }

  const handleCloseRatingModal = () => {
    setShowRatingModal(false)
  }

  const handleCourseChange = (courseId) => {
    setSelectedCourse(courseId)
    setRatingForm(prev => ({ ...prev, course_id: courseId }))
    
    // Filter lecturers who teach this course
    if (courseId) {
      // This would typically come from an API endpoint that gets lecturers by course
      // For now, we'll use all lecturers
      setSelectedLecturer("")
      setRatingForm(prev => ({ ...prev, lecturer_id: "" }))
    }
  }

  const handleLecturerChange = (lecturerId) => {
    setSelectedLecturer(lecturerId)
    setRatingForm(prev => ({ ...prev, lecturer_id: lecturerId }))
  }

  const handleStarClick = (star) => {
    setRatingForm(prev => ({ ...prev, rating: star }))
  }

  const handleSubmitRating = async (e) => {
    e.preventDefault()
    
    if (!ratingForm.course_id || !ratingForm.lecturer_id || ratingForm.rating === 0) {
      alert("Please select a course, lecturer, and provide a rating")
      return
    }

    try {
      const res = await apiMethods.post(API_ENDPOINTS.RATINGS, ratingForm)
      
      if (res.success) {
        alert("Rating submitted successfully!")
        handleCloseRatingModal()
        fetchData() // Refresh the ratings list
      }
    } catch (err) {
      console.error("Failed to submit rating:", err)
      alert("Failed to submit rating. Please try again.")
    }
  }

  const renderStars = (rating, interactive = false, onStarClick = null) => {
    return (
      <div className="d-flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <i
            key={star}
            className={`fas fa-star ${star <= rating ? "text-warning" : "text-muted"} ${
              interactive ? "cursor-pointer hover-scale" : ""
            }`}
            style={{
              fontSize: interactive ? "2rem" : "1rem",
              cursor: interactive ? "pointer" : "default",
              transition: "all 0.2s ease",
              marginRight: "2px"
            }}
            onClick={() => interactive && onStarClick && onStarClick(star)}
            onMouseEnter={(e) => {
              if (interactive) {
                e.target.style.transform = "scale(1.2)"
              }
            }}
            onMouseLeave={(e) => {
              if (interactive) {
                e.target.style.transform = "scale(1)"
              }
            }}
          ></i>
        ))}
      </div>
    )
  }

  const getRatingStats = () => {
    const totalRatings = myRatings.length
    const averageRating = totalRatings > 0 
      ? myRatings.reduce((sum, r) => sum + r.rating, 0) / totalRatings 
      : 0
    
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    myRatings.forEach(r => {
      distribution[r.rating] = (distribution[r.rating] || 0) + 1
    })

    return { totalRatings, averageRating, distribution }
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading ratings...</span>
        </div>
      </div>
    )
  }

  const { totalRatings, averageRating, distribution } = getRatingStats()

  return (
    <div className="container-fluid py-4">
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h4 className="text-primary mb-1">Course & Lecturer Ratings</h4>
              <p className="text-muted mb-0">Rate your courses and lecturers based on your learning experience</p>
            </div>
            <button className="btn btn-primary" onClick={handleOpenRatingModal}>
              <i className="fas fa-star me-2"></i>
              Submit New Rating
            </button>
          </div>
        </div>
      </div>

      {/* Rating Summary */}
      <div className="row mb-4">
        <div className="col-md-4 mb-3">
          <div className="card shadow text-center">
            <div className="card-body py-4">
              <h2 className="display-4 text-primary mb-2">{averageRating.toFixed(1)}</h2>
              <div className="mb-2">{renderStars(Math.round(averageRating))}</div>
              <p className="text-muted mb-0">
                Based on {totalRatings} rating{totalRatings !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>

        <div className="col-md-8 mb-3">
          <div className="card shadow">
            <div className="card-header bg-white">
              <h6 className="mb-0">My Rating Distribution</h6>
            </div>
            <div className="card-body">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = distribution[star]
                const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0

                return (
                  <div key={star} className="d-flex align-items-center mb-2">
                    <div className="me-2" style={{ width: "60px" }}>
                      {star} <i className="fas fa-star text-warning"></i>
                    </div>
                    <div className="progress flex-grow-1 me-2" style={{ height: "20px" }}>
                      <div className="progress-bar bg-warning" style={{ width: `${percentage}%` }}>
                        {count > 0 && <span className="px-2">{count}</span>}
                      </div>
                    </div>
                    <div style={{ width: "50px" }} className="text-end">
                      {percentage.toFixed(0)}%
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* My Ratings List */}
      <div className="row">
        <div className="col-12">
          <div className="card shadow">
            <div className="card-header bg-white d-flex justify-content-between align-items-center">
              <h6 className="mb-0">My Previous Ratings</h6>
              <span className="badge bg-primary">{myRatings.length} ratings</span>
            </div>
            <div className="card-body">
              {myRatings.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-star fa-3x text-muted mb-3"></i>
                  <h5 className="text-muted">No ratings submitted yet</h5>
                  <p className="text-muted mb-3">You haven't rated any courses or lecturers yet.</p>
                  <button className="btn btn-primary" onClick={handleOpenRatingModal}>
                    <i className="fas fa-star me-2"></i>
                    Submit Your First Rating
                  </button>
                </div>
              ) : (
                <div className="row">
                  {myRatings.map((rating) => (
                    <div key={rating.id} className="col-md-6 col-lg-4 mb-4">
                      <div className="card h-100 border-0 shadow-sm">
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <div>
                              <h6 className="card-title text-primary mb-1">{rating.course_name}</h6>
                              <small className="text-muted">{rating.course_code}</small>
                            </div>
                            <div className="text-end">
                              <div className="mb-1">{renderStars(rating.rating)}</div>
                              <small className="text-muted">
                                {new Date(rating.created_at).toLocaleDateString()}
                              </small>
                            </div>
                          </div>
                          
                          <div className="mb-3">
                            <strong className="text-muted">Lecturer:</strong>
                            <p className="mb-0">{rating.lecturer_name}</p>
                          </div>

                          {rating.comment && (
                            <div>
                              <strong className="text-muted">Your Comment:</strong>
                              <p className="mb-0 mt-1 text-muted" style={{ fontStyle: "italic" }}>
                                "{rating.comment}"
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Submit New Rating</h5>
                <button type="button" className="btn-close" onClick={handleCloseRatingModal}></button>
              </div>
              <form onSubmit={handleSubmitRating}>
                <div className="modal-body">
                  <div className="mb-4">
                    <label className="form-label fw-semibold">Select Course *</label>
                    <select
                      className="form-select"
                      value={selectedCourse}
                      onChange={(e) => handleCourseChange(e.target.value)}
                      required
                    >
                      <option value="">Choose a course...</option>
                      {courses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.course_name} ({course.course_code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-semibold">Select Lecturer *</label>
                    <select
                      className="form-select"
                      value={selectedLecturer}
                      onChange={(e) => handleLecturerChange(e.target.value)}
                      required
                      disabled={!selectedCourse}
                    >
                      <option value="">Choose a lecturer...</option>
                      {lecturers.map((lecturer) => (
                        <option key={lecturer.id} value={lecturer.id}>
                          {lecturer.first_name} {lecturer.last_name}
                        </option>
                      ))}
                    </select>
                    {!selectedCourse && (
                      <small className="text-muted">Please select a course first</small>
                    )}
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-semibold">Your Rating *</label>
                    <div className="text-center">
                      {renderStars(ratingForm.rating, true, handleStarClick)}
                      <div className="mt-2">
                        <small className="text-muted">
                          {ratingForm.rating === 0 ? "Select a rating" : `${ratingForm.rating} out of 5 stars`}
                        </small>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Your Feedback <small className="text-muted">(Optional)</small>
                    </label>
                    <textarea
                      className="form-control"
                      rows="4"
                      value={ratingForm.comment}
                      onChange={(e) => setRatingForm(prev => ({ ...prev, comment: e.target.value }))}
                      placeholder="Share your experience with this course and lecturer..."
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={handleCloseRatingModal}>
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={!ratingForm.course_id || !ratingForm.lecturer_id || ratingForm.rating === 0}
                  >
                    <i className="fas fa-star me-2"></i>
                    Submit Rating
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .cursor-pointer {
          cursor: pointer;
        }
        .hover-scale:hover {
          transform: scale(1.2);
        }
      `}</style>
    </div>
  )
}
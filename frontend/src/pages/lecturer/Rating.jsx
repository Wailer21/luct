"use client"

import { useEffect, useState } from "react"
import { useAuth } from "../../utils/auth"
import { apiMethods, API_ENDPOINTS } from "../../utils/api"

export default function LecturerRating() {
  const { token, user } = useAuth()
  const [ratings, setRatings] = useState([])
  const [averageRating, setAverageRating] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    fetchRatings()
  }, [token])

  const fetchRatings = async () => {
    try {
      const res = await apiMethods.get(API_ENDPOINTS.RATINGS_LECTURER)

      if (res.success) {
        const ratingsData = res.data || []
        setRatings(ratingsData)

        if (ratingsData.length > 0) {
          const avg = ratingsData.reduce((sum, r) => sum + r.rating, 0) / ratingsData.length
          setAverageRating(avg)
        }
      }
    } catch (err) {
      console.error("Failed to fetch ratings:", err)
    } finally {
      setLoading(false)
    }
  }

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <i key={index} className={`fas fa-star ${index < rating ? "text-warning" : "text-muted"}`}></i>
    ))
  }

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    ratings.forEach((r) => {
      distribution[r.rating] = (distribution[r.rating] || 0) + 1
    })
    return distribution
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

  const distribution = getRatingDistribution()

  return (
    <div className="container-fluid py-4">
      <div className="row mb-4">
        <div className="col-12">
          <h4 className="text-primary mb-1">My Ratings</h4>
          <p className="text-muted mb-0">View student feedback and ratings for your courses</p>
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
                Based on {ratings.length} rating{ratings.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>

        <div className="col-md-8 mb-3">
          <div className="card shadow">
            <div className="card-header bg-white">
              <h6 className="mb-0">Rating Distribution</h6>
            </div>
            <div className="card-body">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = distribution[star]
                const percentage = ratings.length > 0 ? (count / ratings.length) * 100 : 0

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

      {/* Individual Ratings */}
      <div className="row">
        <div className="col-12">
          <div className="card shadow">
            <div className="card-header bg-white">
              <h6 className="mb-0">Student Feedback</h6>
            </div>
            <div className="card-body">
              {ratings.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-star fa-3x text-muted mb-3"></i>
                  <h5 className="text-muted">No ratings yet</h5>
                  <p className="text-muted">You haven't received any ratings from students yet.</p>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {ratings.map((rating) => (
                    <div key={rating.id} className="list-group-item">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <div className="mb-1">{renderStars(rating.rating)}</div>
                          {rating.course_name && (
                            <small className="text-muted">
                              <i className="fas fa-book me-1"></i>
                              {rating.course_name}
                            </small>
                          )}
                        </div>
                        <small className="text-muted">{new Date(rating.created_at).toLocaleDateString()}</small>
                      </div>
                      {rating.comment && <p className="mb-0 text-muted">{rating.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
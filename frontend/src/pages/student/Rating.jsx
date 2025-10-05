import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/auth';
import { apiMethods } from '../utils/api';

export default function Rating() {
  const [lecturers, setLecturers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [myRatings, setMyRatings] = useState([]);
  const [courseStats, setCourseStats] = useState([]);
  const [lecturerStats, setLecturerStats] = useState([]);
  const [selectedType, setSelectedType] = useState('lecturer');
  const [selectedId, setSelectedId] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('rate');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [lecturersRes, coursesRes, ratingsRes, courseStatsRes, lecturerStatsRes] = await Promise.all([
        apiMethods.getLecturers(),
        apiMethods.getCourses(),
        apiMethods.getMyRatings(),
        apiMethods.getCourseRatingStats(),
        apiMethods.getLecturerRatingStats()
      ]);

      if (lecturersRes.success) setLecturers(lecturersRes.data);
      if (coursesRes.success) setCourses(coursesRes.data);
      if (ratingsRes.success) setMyRatings(ratingsRes.data);
      if (courseStatsRes.success) setCourseStats(courseStatsRes.data);
      if (lecturerStatsRes.success) setLecturerStats(lecturerStatsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedId) {
      setError('Please select a ' + selectedType + ' to rate.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const ratingData = {
        rating,
        comment: comment.trim(),
        [selectedType === 'lecturer' ? 'lecturer_id' : 'course_id']: selectedId
      };

      const response = await apiMethods.submitRating(ratingData);
      if (response.success) {
        setSuccess('Rating submitted successfully!');
        setRating(5);
        setComment('');
        setSelectedId('');
        fetchData(); // Refresh all data
      } else {
        setError(response.message || 'Failed to submit rating.');
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      setError(error.message || 'Failed to submit rating. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const hasRated = (type, id) => {
    return myRatings.some(rating => 
      (type === 'lecturer' && rating.lecturer_id === id) ||
      (type === 'course' && rating.course_id === id)
    );
  };

  const getRatedItemName = (type, id) => {
    if (type === 'lecturer') {
      const lecturer = lecturers.find(l => l.id === id);
      return lecturer ? `${lecturer.first_name} ${lecturer.last_name}` : 'Unknown Lecturer';
    } else {
      const course = courses.find(c => c.id === id);
      return course ? `${course.code} - ${course.course_name}` : 'Unknown Course';
    }
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <h2 className="text-primary mb-4">
            <i className="fas fa-star me-2"></i>
            Ratings & Reviews
          </h2>

          {/* Tab Navigation */}
          <div className="card shadow mb-4">
            <div className="card-header bg-white">
              <ul className="nav nav-tabs card-header-tabs">
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'rate' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('rate'); clearMessages(); }}
                  >
                    <i className="fas fa-plus-circle me-2"></i>
                    Submit Rating
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'my-ratings' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('my-ratings'); clearMessages(); }}
                  >
                    <i className="fas fa-history me-2"></i>
                    My Ratings
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'stats' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('stats'); clearMessages(); }}
                  >
                    <i className="fas fa-chart-bar me-2"></i>
                    Statistics
                  </button>
                </li>
              </ul>
            </div>

            <div className="card-body">
              {error && (
                <div className="alert alert-danger" role="alert">
                  <i className="fas fa-exclamation-circle me-2"></i>
                  {error}
                </div>
              )}

              {success && (
                <div className="alert alert-success" role="alert">
                  <i className="fas fa-check-circle me-2"></i>
                  {success}
                </div>
              )}

              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary"></div>
                  <p className="mt-2">Loading...</p>
                </div>
              ) : (
                <>
                  {/* Submit Rating Tab */}
                  {activeTab === 'rate' && (
                    <div className="row">
                      <div className="col-lg-8 mx-auto">
                        <form onSubmit={handleSubmit}>
                          <div className="mb-4">
                            <label className="form-label fw-bold">Rate a:</label>
                            <div className="btn-group w-100" role="group">
                              <button
                                type="button"
                                className={`btn ${selectedType === 'lecturer' ? 'btn-primary' : 'btn-outline-primary'}`}
                                onClick={() => { setSelectedType('lecturer'); setSelectedId(''); clearMessages(); }}
                              >
                                <i className="fas fa-chalkboard-teacher me-2"></i>
                                Lecturer
                              </button>
                              <button
                                type="button"
                                className={`btn ${selectedType === 'course' ? 'btn-primary' : 'btn-outline-primary'}`}
                                onClick={() => { setSelectedType('course'); setSelectedId(''); clearMessages(); }}
                              >
                                <i className="fas fa-book me-2"></i>
                                Course
                              </button>
                            </div>
                          </div>

                          <div className="mb-4">
                            <label className="form-label fw-bold">
                              Select {selectedType === 'lecturer' ? 'Lecturer' : 'Course'}:
                            </label>
                            <select
                              className="form-select"
                              value={selectedId}
                              onChange={(e) => { setSelectedId(e.target.value); clearMessages(); }}
                              required
                            >
                              <option value="">Choose a {selectedType}</option>
                              {(selectedType === 'lecturer' ? lecturers : courses)
                                .filter(item => !hasRated(selectedType, item.id))
                                .map(item => (
                                  <option key={item.id} value={item.id}>
                                    {selectedType === 'lecturer' 
                                      ? `${item.first_name} ${item.last_name}`
                                      : `${item.code} - ${item.course_name}`
                                    }
                                  </option>
                                ))
                              }
                            </select>
                            {selectedId && hasRated(selectedType, selectedId) && (
                              <div className="alert alert-warning mt-2">
                                <i className="fas fa-exclamation-triangle me-2"></i>
                                You have already rated this {selectedType}
                              </div>
                            )}
                          </div>

                          <div className="mb-4">
                            <label className="form-label fw-bold">Rating:</label>
                            <div className="d-flex align-items-center mb-2">
                              {[1, 2, 3, 4, 5].map(star => (
                                <button
                                  key={star}
                                  type="button"
                                  className="btn btn-link p-1"
                                  onClick={() => setRating(star)}
                                >
                                  <i
                                    className={`fas fa-star fa-2x ${
                                      star <= rating ? 'text-warning' : 'text-muted'
                                    }`}
                                  ></i>
                                </button>
                              ))}
                              <span className="ms-3 fw-bold fs-5">{rating}/5</span>
                            </div>
                            <div className="text-muted">
                              <small>
                                {rating === 1 && "Poor"}
                                {rating === 2 && "Fair"}
                                {rating === 3 && "Good"}
                                {rating === 4 && "Very Good"}
                                {rating === 5 && "Excellent"}
                              </small>
                            </div>
                          </div>

                          <div className="mb-4">
                            <label className="form-label fw-bold">Comment (optional):</label>
                            <textarea
                              className="form-control"
                              rows="4"
                              value={comment}
                              onChange={(e) => setComment(e.target.value)}
                              placeholder={`Share your experience with this ${selectedType}...`}
                              maxLength="500"
                            ></textarea>
                            <div className="form-text">
                              {comment.length}/500 characters
                            </div>
                          </div>

                          <button
                            type="submit"
                            className="btn btn-primary btn-lg w-100"
                            disabled={submitting || !selectedId || hasRated(selectedType, selectedId)}
                          >
                            {submitting ? (
                              <>
                                <div className="spinner-border spinner-border-sm me-2"></div>
                                Submitting...
                              </>
                            ) : (
                              <>
                                <i className="fas fa-star me-2"></i>
                                Submit Rating
                              </>
                            )}
                          </button>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* My Ratings Tab */}
                  {activeTab === 'my-ratings' && (
                    <div>
                      <h5 className="mb-4">My Rating History</h5>
                      {myRatings.length === 0 ? (
                        <div className="text-center py-5">
                          <i className="fas fa-star fa-3x text-muted mb-3"></i>
                          <h5 className="text-muted">No ratings submitted yet</h5>
                          <p className="text-muted">Start by rating a lecturer or course in the "Submit Rating" tab</p>
                        </div>
                      ) : (
                        <div className="row">
                          {myRatings.map((ratingItem) => (
                            <div key={ratingItem.id} className="col-md-6 mb-3">
                              <div className="card h-100">
                                <div className="card-body">
                                  <div className="d-flex justify-content-between align-items-start mb-2">
                                    <h6 className="card-title mb-0">
                                      {ratingItem.lecturer_first_name && ratingItem.lecturer_last_name 
                                        ? `${ratingItem.lecturer_first_name} ${ratingItem.lecturer_last_name}`
                                        : `${ratingItem.course_code} - ${ratingItem.course_name}`
                                      }
                                    </h6>
                                    <span className="badge bg-info">
                                      {ratingItem.rating_type}
                                    </span>
                                  </div>
                                  
                                  <div className="mb-2">
                                    {[1, 2, 3, 4, 5].map(star => (
                                      <i
                                        key={star}
                                        className={`fas fa-star ${
                                          star <= ratingItem.rating ? 'text-warning' : 'text-muted'
                                        } me-1`}
                                      ></i>
                                    ))}
                                    <strong className="ms-1">{ratingItem.rating}/5</strong>
                                  </div>
                                  
                                  {ratingItem.comment && (
                                    <p className="card-text">
                                      <em>"{ratingItem.comment}"</em>
                                    </p>
                                  )}
                                  
                                  <small className="text-muted">
                                    Rated on {new Date(ratingItem.created_at).toLocaleDateString()}
                                  </small>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Statistics Tab */}
                  {activeTab === 'stats' && (
                    <div>
                      <div className="row">
                        <div className="col-md-6">
                          <h5 className="mb-4">
                            <i className="fas fa-chalkboard-teacher me-2"></i>
                            Lecturer Ratings
                          </h5>
                          {lecturerStats.length === 0 ? (
                            <div className="text-center py-4">
                              <i className="fas fa-chart-bar fa-2x text-muted mb-3"></i>
                              <p className="text-muted">No lecturer ratings available</p>
                            </div>
                          ) : (
                            <div className="table-responsive">
                              <table className="table table-striped">
                                <thead>
                                  <tr>
                                    <th>Lecturer</th>
                                    <th>Avg Rating</th>
                                    <th>Total Ratings</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {lecturerStats.map((stat, index) => (
                                    <tr key={stat.lecturer_id}>
                                      <td>{stat.first_name} {stat.last_name}</td>
                                      <td>
                                        <strong>{stat.average_rating}</strong>/5
                                        <div className="small">
                                          {[1, 2, 3, 4, 5].map(star => (
                                            <i
                                              key={star}
                                              className={`fas fa-star ${
                                                star <= Math.round(stat.average_rating) ? 'text-warning' : 'text-muted'
                                              } me-1`}
                                            ></i>
                                          ))}
                                        </div>
                                      </td>
                                      <td>
                                        <span className="badge bg-primary">{stat.total_ratings}</span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>

                        <div className="col-md-6">
                          <h5 className="mb-4">
                            <i className="fas fa-book me-2"></i>
                            Course Ratings
                          </h5>
                          {courseStats.length === 0 ? (
                            <div className="text-center py-4">
                              <i className="fas fa-chart-bar fa-2x text-muted mb-3"></i>
                              <p className="text-muted">No course ratings available</p>
                            </div>
                          ) : (
                            <div className="table-responsive">
                              <table className="table table-striped">
                                <thead>
                                  <tr>
                                    <th>Course</th>
                                    <th>Avg Rating</th>
                                    <th>Total Ratings</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {courseStats.map((stat, index) => (
                                    <tr key={stat.course_id}>
                                      <td>
                                        <div><strong>{stat.course_code}</strong></div>
                                        <small className="text-muted">{stat.course_name}</small>
                                      </td>
                                      <td>
                                        <strong>{stat.average_rating}</strong>/5
                                        <div className="small">
                                          {[1, 2, 3, 4, 5].map(star => (
                                            <i
                                              key={star}
                                              className={`fas fa-star ${
                                                star <= Math.round(stat.average_rating) ? 'text-warning' : 'text-muted'
                                              } me-1`}
                                            ></i>
                                          ))}
                                        </div>
                                      </td>
                                      <td>
                                        <span className="badge bg-primary">{stat.total_ratings}</span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
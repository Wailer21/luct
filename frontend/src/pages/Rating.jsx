import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/auth';
import { apiMethods } from '../utils/api';

export default function Rating() {
  const [lecturers, setLecturers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [myRatings, setMyRatings] = useState([]);
  const [selectedType, setSelectedType] = useState('lecturer');
  const [selectedId, setSelectedId] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [lecturersRes, coursesRes, ratingsRes] = await Promise.all([
        apiMethods.getLecturers(),
        apiMethods.getCourses(),
        user?.role === 'Lecturer' ? apiMethods.getLecturerRatings() : apiMethods.getMyRatings()
      ]);

      if (lecturersRes.success) setLecturers(lecturersRes.data);
      if (coursesRes.success) setCourses(coursesRes.data);
      if (ratingsRes.success) setMyRatings(ratingsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedId) return;

    setSubmitting(true);
    try {
      const ratingData = {
        rating,
        comment,
        [selectedType === 'lecturer' ? 'lecturer_id' : 'course_id']: selectedId
      };

      const response = await apiMethods.submitRating(ratingData);
      if (response.success) {
        setRating(5);
        setComment('');
        setSelectedId('');
        fetchData(); // Refresh ratings
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
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

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <h2 className="text-primary mb-4">
            <i className="fas fa-star me-2"></i>
            Ratings & Reviews
          </h2>

          <div className="row">
            <div className="col-lg-6 mb-4">
              <div className="card shadow">
                <div className="card-header bg-primary text-white">
                  <h5 className="mb-0">
                    <i className="fas fa-plus-circle me-2"></i>
                    Submit Rating
                  </h5>
                </div>
                <div className="card-body">
                  <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                      <label className="form-label">Rate a:</label>
                      <div className="btn-group w-100" role="group">
                        <button
                          type="button"
                          className={`btn ${selectedType === 'lecturer' ? 'btn-primary' : 'btn-outline-primary'}`}
                          onClick={() => setSelectedType('lecturer')}
                        >
                          Lecturer
                        </button>
                        <button
                          type="button"
                          className={`btn ${selectedType === 'course' ? 'btn-primary' : 'btn-outline-primary'}`}
                          onClick={() => setSelectedType('course')}
                        >
                          Course
                        </button>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">
                        Select {selectedType === 'lecturer' ? 'Lecturer' : 'Course'}:
                      </label>
                      <select
                        className="form-select"
                        value={selectedId}
                        onChange={(e) => setSelectedId(e.target.value)}
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
                        <div className="text-warning mt-1">
                          <small>
                            <i className="fas fa-exclamation-triangle me-1"></i>
                            You have already rated this {selectedType}
                          </small>
                        </div>
                      )}
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Rating:</label>
                      <div className="d-flex align-items-center">
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
                        <span className="ms-2 fw-bold">{rating}/5</span>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Comment (optional):</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Share your experience..."
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary w-100"
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
            </div>

            <div className="col-lg-6">
              <div className="card shadow">
                <div className="card-header bg-success text-white">
                  <h5 className="mb-0">
                    <i className="fas fa-history me-2"></i>
                    My Ratings
                  </h5>
                </div>
                <div className="card-body">
                  {loading ? (
                    <div className="text-center py-4">
                      <div className="spinner-border text-primary"></div>
                      <p className="mt-2">Loading ratings...</p>
                    </div>
                  ) : myRatings.length === 0 ? (
                    <div className="text-center py-5">
                      <i className="fas fa-star fa-3x text-muted mb-3"></i>
                      <h5 className="text-muted">No ratings submitted</h5>
                      <p className="text-muted">Start by rating a lecturer or course</p>
                    </div>
                  ) : (
                    <div className="list-group">
                      {myRatings.map((ratingItem) => (
                        <div key={ratingItem.id} className="list-group-item">
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <h6 className="mb-1">
                                {ratingItem.lecturer_name || ratingItem.course_name}
                              </h6>
                              <p className="mb-1 text-muted">
                                <small>
                                  {ratingItem.course_code && `Course: ${ratingItem.course_code} | `}
                                  Type: {ratingItem.rating_type}
                                </small>
                              </p>
                              <div className="mb-1">
                                {[1, 2, 3, 4, 5].map(star => (
                                  <i
                                    key={star}
                                    className={`fas fa-star ${
                                      star <= ratingItem.rating ? 'text-warning' : 'text-muted'
                                    }`}
                                  ></i>
                                ))}
                                <span className="ms-1 fw-bold">{ratingItem.rating}/5</span>
                              </div>
                              {ratingItem.comment && (
                                <p className="mb-0">
                                  <small>"{ratingItem.comment}"</small>
                                </p>
                              )}
                            </div>
                            <small className="text-muted">
                              {new Date(ratingItem.created_at).toLocaleDateString()}
                            </small>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
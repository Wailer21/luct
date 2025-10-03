// Rating.jsx - Fixed to work with your API structure
import React, { useEffect, useState } from 'react';
import { useAuth } from '../utils/auth';
import { api, API_ENDPOINTS } from '../utils/api';

export default function Rating() {
  const { user } = useAuth();
  const [myRatings, setMyRatings] = useState([]);
  const [receivedRatings, setReceivedRatings] = useState([]);
  const [courses, setCourses] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      console.log('Fetching data for user role:', user?.role);

      if (user?.role === 'Student') {
        // Fetch courses, lecturers, and user's ratings
        const [coursesRes, lecturersRes, myRatingsRes] = await Promise.all([
          api.get(API_ENDPOINTS.COURSES, true),
          api.get(API_ENDPOINTS.LECTURERS, true),
          api.get(API_ENDPOINTS.RATINGS_MY, true)
        ]);

        console.log('API Responses:', { coursesRes, lecturersRes, myRatingsRes });

        if (coursesRes.success) {
          setCourses(coursesRes.data || []);
        } else {
          console.warn('Failed to load courses:', coursesRes.message);
        }

        if (lecturersRes.success) {
          setLecturers(lecturersRes.data || []);
        } else {
          console.warn('Failed to load lecturers:', lecturersRes.message);
        }

        if (myRatingsRes.success) {
          setMyRatings(myRatingsRes.data || []);
        }

      } else if (user?.role === 'Lecturer') {
        // Fetch ratings received by lecturer
        const [receivedRes, myRatingsRes] = await Promise.all([
          api.get(API_ENDPOINTS.RATINGS_LECTURER, true),
          api.get(API_ENDPOINTS.RATINGS_MY, true)
        ]);

        if (receivedRes.success) {
          setReceivedRatings(receivedRes.data || []);
        }

        if (myRatingsRes.success) {
          setMyRatings(myRatingsRes.data || []);
        }

      } else {
        // PRL, PL, Admin - fetch all ratings and data
        const [allRatingsRes, coursesRes, lecturersRes] = await Promise.all([
          api.get(API_ENDPOINTS.RATINGS, true),
          api.get(API_ENDPOINTS.COURSES, true),
          api.get(API_ENDPOINTS.LECTURERS, true)
        ]);

        if (allRatingsRes.success) {
          setMyRatings(allRatingsRes.data || []);
        }

        if (coursesRes.success) setCourses(coursesRes.data || []);
        if (lecturersRes.success) setLecturers(lecturersRes.data || []);
      }

    } catch (error) {
      console.error('Failed to fetch rating data:', error);
      setError('Failed to load rating data. Please check if the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  const submitRating = async () => {
    try {
      setError('');
      setSuccess('');

      const ratingData = {
        lecturer_id: selectedItem.type === 'lecturer' ? selectedItem.id : null,
        course_id: selectedItem.type === 'course' ? selectedItem.id : null,
        rating: parseInt(rating),
        comment: comment.trim() || null
      };

      // Validate rating data
      if (!ratingData.lecturer_id && !ratingData.course_id) {
        setError('Please select either a course or lecturer to rate.');
        return;
      }

      console.log('Submitting rating:', ratingData);

      const response = await api.post(API_ENDPOINTS.RATINGS, ratingData, true);
      
      if (response.success) {
        setSelectedItem(null);
        setRating(0);
        setComment('');
        setSuccess('Rating submitted successfully!');
        await fetchData(); // Refresh data
      } else {
        setError(response.message || 'Failed to submit rating.');
      }

    } catch (error) {
      console.error('Failed to submit rating:', error);
      setError(error.message || 'Failed to submit rating. Please try again.');
    }
  };

  const RatingStars = ({ currentRating, onRatingChange, readonly = false, size = '2x' }) => {
    return (
      <div className="rating-stars">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            className={`btn btn-link p-1 ${star <= currentRating ? 'text-warning' : 'text-muted'} ${readonly ? 'pe-none' : ''}`}
            onClick={() => !readonly && onRatingChange(star)}
            disabled={readonly}
          >
            <i className={`fas fa-star fa-${size}`}></i>
          </button>
        ))}
      </div>
    );
  };

  // Check if user has already rated an item
  const hasRatedItem = (itemId, itemType) => {
    return myRatings.some(rating => 
      (itemType === 'course' && rating.course_id === itemId) ||
      (itemType === 'lecturer' && rating.lecturer_id === itemId)
    );
  };

  // Get available courses for rating (not already rated)
  const getAvailableCourses = () => {
    return courses.filter(course => !hasRatedItem(course.id, 'course'));
  };

  // Get available lecturers for rating (not already rated)
  const getAvailableLecturers = () => {
    return lecturers.filter(lecturer => !hasRatedItem(lecturer.id, 'lecturer'));
  };

  // Role-based configuration
  const getRoleConfig = () => {
    const config = {
      Student: {
        title: '⭐ Rate Your Learning Experience',
        description: 'Provide feedback on courses and lecturers to help improve teaching quality',
        canRate: true,
        viewType: 'student'
      },
      Lecturer: {
        title: '📊 Ratings & Feedback Received',
        description: 'View ratings and feedback from students for your courses',
        canRate: false,
        viewType: 'lecturer'
      },
      PRL: {
        title: '📈 Rating Analytics',
        description: 'Monitor rating trends and feedback across your faculty',
        canRate: false,
        viewType: 'admin'
      },
      PL: {
        title: '📈 Program Ratings',
        description: 'Overview of ratings and feedback in your program',
        canRate: false,
        viewType: 'admin'
      },
      Admin: {
        title: '📊 System Rating Analytics',
        description: 'Comprehensive overview of all ratings and feedback in the system',
        canRate: false,
        viewType: 'admin'
      }
    };
    return config[user?.role] || config.Student;
  };

  const roleConfig = getRoleConfig();
  const availableCourses = getAvailableCourses();
  const availableLecturers = getAvailableLecturers();

  if (loading) {
    return (
      <div className="container-fluid">
        <div className="d-flex justify-content-center align-items-center py-5">
          <div className="text-center">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Loading ratings...</span>
            </div>
            <p className="text-muted">Loading rating data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="row mb-4">
        <div className="col-12">
          <h4 className="text-primary mb-1 fw-bold">{roleConfig.title}</h4>
          <p className="text-muted">{roleConfig.description}</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger d-flex align-items-center" role="alert">
          <i className="fas fa-exclamation-triangle me-2"></i>
          <div>{error}</div>
        </div>
      )}

      {success && (
        <div className="alert alert-success d-flex align-items-center" role="alert">
          <i className="fas fa-check-circle me-2"></i>
          <div>{success}</div>
        </div>
      )}

      {/* Backend Connection Help */}
      {courses.length === 0 && lecturers.length === 0 && (
        <div className="alert alert-warning">
          <i className="fas fa-exclamation-triangle me-2"></i>
          <strong>Backend Connection Issue:</strong> Unable to load courses and lecturers data. 
          Please ensure:
          <ul className="mb-0 mt-2">
            <li>Your backend server is running on <code>http://localhost:5000</code></li>
            <li>The API endpoints are properly configured</li>
            <li>You have courses and lecturers in your database</li>
          </ul>
        </div>
      )}

      {/* Rating Modal */}
      {selectedItem && roleConfig.canRate && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Rate {selectedItem.type === 'course' ? 'Course' : 'Lecturer'}
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => {
                    setSelectedItem(null);
                    setRating(0);
                    setComment('');
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <div className="text-center mb-4">
                  <h6 className="text-primary">{selectedItem.name}</h6>
                  {selectedItem.additionalInfo && (
                    <p className="text-muted mb-0">{selectedItem.additionalInfo}</p>
                  )}
                </div>
                
                <div className="text-center mb-4">
                  <label className="form-label fw-semibold mb-3">Select Rating:</label>
                  <RatingStars currentRating={rating} onRatingChange={setRating} size="lg" />
                  {rating > 0 && (
                    <div className="mt-2">
                      <small className="text-muted">
                        {rating === 1 && 'Poor'}
                        {rating === 2 && 'Fair'}
                        {rating === 3 && 'Good'}
                        {rating === 4 && 'Very Good'}
                        {rating === 5 && 'Excellent'}
                      </small>
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Comments (Optional)</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your experience, suggestions, or feedback..."
                  ></textarea>
                </div>

                <div className="d-flex gap-2 justify-content-end">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => {
                      setSelectedItem(null);
                      setRating(0);
                      setComment('');
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={submitRating}
                    disabled={rating === 0}
                  >
                    <i className="fas fa-paper-plane me-2"></i>
                    Submit Rating
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student Rating Interface */}
      {roleConfig.viewType === 'student' && (
        <div className="row">
          {/* Rate Courses */}
          <div className="col-md-6 mb-4">
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">
                  <i className="fas fa-book me-2"></i>
                  Rate Courses
                  {availableCourses.length > 0 && (
                    <span className="badge bg-light text-primary ms-2">
                      {availableCourses.length} available
                    </span>
                  )}
                </h5>
              </div>
              <div className="card-body">
                <p className="text-muted mb-4">
                  Provide feedback on courses you've taken to help improve course content and delivery.
                </p>
                
                {availableCourses.length > 0 ? (
                  <div className="row g-2">
                    {availableCourses.map(course => (
                      <div key={course.id} className="col-12">
                        <div className="card border">
                          <div className="card-body py-3">
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <h6 className="mb-1 text-primary">{course.course_code}</h6>
                                <p className="mb-0 text-muted small">{course.course_name}</p>
                                {course.faculty_name && (
                                  <small className="text-info">
                                    {course.faculty_name}
                                  </small>
                                )}
                              </div>
                              <button
                                className="btn btn-outline-primary btn-sm"
                                onClick={() => setSelectedItem({
                                  id: course.id,
                                  type: 'course',
                                  name: course.course_name,
                                  additionalInfo: course.course_code
                                })}
                              >
                                <i className="fas fa-star me-1"></i>
                                Rate
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : courses.length > 0 ? (
                  <div className="text-center py-4">
                    <i className="fas fa-check-circle fa-3x text-success mb-3"></i>
                    <h6 className="text-success">All Courses Rated!</h6>
                    <p className="text-muted mb-0">
                      You have rated all available courses. Thank you for your feedback!
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <i className="fas fa-book fa-3x text-muted mb-3"></i>
                    <h6 className="text-muted">No Courses Available</h6>
                    <p className="text-muted">
                      There are no courses available for rating at the moment.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Rate Lecturers */}
          <div className="col-md-6 mb-4">
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-header bg-success text-white">
                <h5 className="mb-0">
                  <i className="fas fa-chalkboard-teacher me-2"></i>
                  Rate Lecturers
                  {availableLecturers.length > 0 && (
                    <span className="badge bg-light text-success ms-2">
                      {availableLecturers.length} available
                    </span>
                  )}
                </h5>
              </div>
              <div className="card-body">
                <p className="text-muted mb-4">
                  Evaluate your lecturers' teaching quality, communication, and support.
                </p>
                
                {availableLecturers.length > 0 ? (
                  <div className="row g-2">
                    {availableLecturers.map(lecturer => (
                      <div key={lecturer.id} className="col-12">
                        <div className="card border">
                          <div className="card-body py-3">
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <h6 className="mb-1 text-success">
                                  {lecturer.first_name} {lecturer.last_name}
                                </h6>
                                <p className="mb-0 text-muted small">{lecturer.email}</p>
                                <small className="text-info">
                                  Lecturer
                                </small>
                              </div>
                              <button
                                className="btn btn-outline-success btn-sm"
                                onClick={() => setSelectedItem({
                                  id: lecturer.id,
                                  type: 'lecturer',
                                  name: `${lecturer.first_name} ${lecturer.last_name}`,
                                  additionalInfo: lecturer.email
                                })}
                              >
                                <i className="fas fa-star me-1"></i>
                                Rate
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : lecturers.length > 0 ? (
                  <div className="text-center py-4">
                    <i className="fas fa-check-circle fa-3x text-success mb-3"></i>
                    <h6 className="text-success">All Lecturers Rated!</h6>
                    <p className="text-muted mb-0">
                      You have rated all available lecturers. Thank you for your feedback!
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <i className="fas fa-users fa-3x text-muted mb-3"></i>
                    <h6 className="text-muted">No Lecturers Available</h6>
                    <p className="text-muted">
                      There are no lecturers available for rating at the moment.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Show rating history if user has any ratings */}
      {myRatings.length > 0 && (
        <div className="card mt-4 border-0 shadow-sm">
          <div className="card-header bg-white">
            <h5 className="mb-0">
              <i className="fas fa-history me-2 text-primary"></i>
              Your Rating History
              <span className="badge bg-primary ms-2">{myRatings.length}</span>
            </h5>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="table-light">
                  <tr>
                    <th>Rated Item</th>
                    <th>Type</th>
                    <th>Your Rating</th>
                    <th>Your Comment</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {myRatings.map(ratingItem => (
                    <tr key={ratingItem.id}>
                      <td>
                        <strong>
                          {ratingItem.course_name || ratingItem.lecturer_name || 'Unknown'}
                        </strong>
                        <br />
                        <small className="text-muted">
                          {ratingItem.course_code || 'Lecturer Rating'}
                        </small>
                      </td>
                      <td>
                        <span className={`badge ${ratingItem.course_name ? 'bg-primary' : 'bg-success'}`}>
                          {ratingItem.course_name ? 'Course' : 'Lecturer'}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <RatingStars currentRating={ratingItem.rating} onRatingChange={() => {}} readonly size="sm" />
                          <span className="ms-2 fw-bold text-warning">
                            {ratingItem.rating}/5
                          </span>
                        </div>
                      </td>
                      <td>
                        {ratingItem.comment ? (
                          <div>
                            <p className="mb-0 small">{ratingItem.comment}</p>
                          </div>
                        ) : (
                          <span className="text-muted small">No comment</span>
                        )}
                      </td>
                      <td>
                        <small>
                          {new Date(ratingItem.created_at).toLocaleDateString()}
                        </small>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
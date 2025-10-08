import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/auth';
import { apiMethods } from '../utils/api';

export default function Rating() {
  const [lecturers, setLecturers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [myRatings, setMyRatings] = useState([]);
  const [selectedLecturer, setSelectedLecturer] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [ratingType, setRatingType] = useState('lecturer'); // 'lecturer' or 'course'
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch all necessary data
      const [lecturersRes, coursesRes] = await Promise.all([
        apiMethods.getLecturers(),
        apiMethods.getCourses()
      ]);

      if (lecturersRes.success) setLecturers(lecturersRes.data || []);
      if (coursesRes.success) setCourses(coursesRes.data || []);

      // Fetch user's ratings
      try {
        const ratingsRes = await apiMethods.getMyRatings();
        if (ratingsRes.success) {
          setMyRatings(ratingsRes.data || []);
        } else {
          console.warn('Could not load ratings:', ratingsRes.message);
          setMyRatings([]);
        }
      } catch (ratingsError) {
        console.warn('Could not load ratings:', ratingsError);
        setMyRatings([]);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation for actual schema
    if (ratingType === 'lecturer' && !selectedLecturer) {
      setError('Please select a lecturer');
      return;
    }

    if (ratingType === 'course' && !selectedCourse) {
      setError('Please select a course');
      return;
    }

    if (!rating) {
      setError('Please select a rating');
      return;
    }

    // Check if user has already rated this specific lecturer or course
    if (ratingType === 'lecturer' && hasRatedLecturer(selectedLecturer)) {
      setError(`You have already rated ${getLecturerName(selectedLecturer)}`);
      return;
    }

    if (ratingType === 'course' && hasRatedCourse(selectedCourse)) {
      setError(`You have already rated ${getCourseName(selectedCourse)}`);
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // Prepare rating data according to your actual database schema
      const ratingData = {
        rating: Number(rating),
        comment: comment.trim() || '',
        lecturer_id: ratingType === 'lecturer' ? parseInt(selectedLecturer) : null,
        course_id: ratingType === 'course' ? parseInt(selectedCourse) : null
      };

      console.log('📊 Submitting rating (frontend):', ratingData);

      const response = await apiMethods.submitRating(ratingData);

      if (response.success) {
        setSuccess('Rating submitted successfully!');
        // Reset form
        setSelectedLecturer('');
        setSelectedCourse('');
        setRating(5);
        setComment('');
        setRatingType('lecturer');
        // Refresh ratings
        fetchData();
      } else {
        // Enhanced error messages
        let errorMessage = response.message || 'Failed to submit rating';
        
        if (response.status === 409) {
          if (ratingType === 'lecturer') {
            errorMessage = 'You have already rated this lecturer.';
          } else {
            errorMessage = 'You have already rated this course.';
          }
        } else if (response.status === 403) {
          errorMessage = 'Only students can submit ratings.';
        } else if (response.status === 404) {
          errorMessage = 'Lecturer or course not found. Please refresh the page and try again.';
        }
        
        setError(errorMessage);
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      setError(error.message || 'Failed to submit rating. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedLecturer('');
    setSelectedCourse('');
    setRating(5);
    setComment('');
    setRatingType('lecturer');
    setError('');
    setSuccess('');
  };

  // Check if user has already rated a specific lecturer
  const hasRatedLecturer = (lecturerId) => {
    return myRatings.some(rating => rating.lecturer_id == lecturerId);
  };

  // Check if user has already rated a specific course
  const hasRatedCourse = (courseId) => {
    return myRatings.some(rating => rating.course_id == courseId);
  };

  // Get lecturer name by ID
  const getLecturerName = (lecturerId) => {
    const lecturer = lecturers.find(l => l.id == lecturerId);
    return lecturer ? `${lecturer.first_name} ${lecturer.last_name}` : 'Unknown Lecturer';
  };

  // Get course name by ID
  const getCourseName = (courseId) => {
    const course = courses.find(c => c.id == courseId);
    return course ? `${course.code} - ${course.course_name || course.name}` : 'Unknown Course';
  };

  // Get rating type display name
  const getRatingTypeDisplay = (ratingItem) => {
    if (ratingItem.lecturer_id) {
      return 'Lecturer Rating';
    } else if (ratingItem.course_id) {
      return 'Course Rating';
    }
    return 'Rating';
  };

  // Render loading state
  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="row">
          <div className="col-12">
            <div className="text-center py-5">
              <div className="spinner-border text-primary" style={{width: '3rem', height: '3rem'}}></div>
              <p className="mt-3">Loading rating system...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <h2 className="text-primary mb-4">
            <i className="fas fa-star me-2"></i>
            Rate Lecturers & Courses
          </h2>

          {/* Success Message */}
          {success && (
            <div className="alert alert-success alert-dismissible fade show" role="alert">
              <i className="fas fa-check-circle me-2"></i>
              {success}
              <button type="button" className="btn-close" onClick={() => setSuccess('')}></button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              <i className="fas fa-exclamation-triangle me-2"></i>
              {error}
              <button type="button" className="btn-close" onClick={() => setError('')}></button>
            </div>
          )}

          <div className="row">
            {/* Rating Form */}
            <div className="col-lg-6 mb-4">
              <div className="card shadow">
                <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    <i className="fas fa-plus-circle me-2"></i>
                    Submit Rating
                  </h5>
                  <button 
                    type="button" 
                    className="btn btn-sm btn-light"
                    onClick={resetForm}
                    disabled={submitting}
                  >
                    <i className="fas fa-redo me-1"></i>
                    Reset
                  </button>
                </div>
                <div className="card-body">
                  <form onSubmit={handleSubmit}>
                    {/* Rating Type Selection */}
                    <div className="mb-3">
                      <label className="form-label fw-bold">What would you like to rate? *</label>
                      <div className="btn-group w-100" role="group">
                        <input
                          type="radio"
                          className="btn-check"
                          name="ratingType"
                          id="rateLecturer"
                          checked={ratingType === 'lecturer'}
                          onChange={() => setRatingType('lecturer')}
                          disabled={submitting}
                        />
                        <label className={`btn ${ratingType === 'lecturer' ? 'btn-primary' : 'btn-outline-primary'}`} htmlFor="rateLecturer">
                          <i className="fas fa-chalkboard-teacher me-2"></i>
                          Rate Lecturer
                        </label>

                        <input
                          type="radio"
                          className="btn-check"
                          name="ratingType"
                          id="rateCourse"
                          checked={ratingType === 'course'}
                          onChange={() => setRatingType('course')}
                          disabled={submitting}
                        />
                        <label className={`btn ${ratingType === 'course' ? 'btn-primary' : 'btn-outline-primary'}`} htmlFor="rateCourse">
                          <i className="fas fa-book me-2"></i>
                          Rate Course
                        </label>
                      </div>
                    </div>

                    {/* Lecturer Selection - Only show when rating lecturer */}
                    {ratingType === 'lecturer' && (
                      <div className="mb-3">
                        <label className="form-label fw-bold">Select Lecturer *</label>
                        <select
                          className="form-select"
                          value={selectedLecturer}
                          onChange={(e) => setSelectedLecturer(e.target.value)}
                          required
                          disabled={submitting}
                        >
                          <option value="">Choose a lecturer</option>
                          {lecturers.map(lecturer => (
                            <option key={lecturer.id} value={lecturer.id}>
                              {lecturer.first_name} {lecturer.last_name}
                              {lecturer.email && ` (${lecturer.email})`}
                            </option>
                          ))}
                        </select>
                        {selectedLecturer && hasRatedLecturer(selectedLecturer) && (
                          <div className="text-warning small mt-1">
                            <i className="fas fa-exclamation-triangle me-1"></i>
                            You have already rated this lecturer
                          </div>
                        )}
                      </div>
                    )}

                    {/* Course Selection - Only show when rating course */}
                    {ratingType === 'course' && (
                      <div className="mb-3">
                        <label className="form-label fw-bold">Select Course *</label>
                        <select
                          className="form-select"
                          value={selectedCourse}
                          onChange={(e) => setSelectedCourse(e.target.value)}
                          required
                          disabled={submitting}
                        >
                          <option value="">Choose a course</option>
                          {courses.map(course => (
                            <option key={course.id} value={course.id}>
                              {course.code} - {course.course_name || course.name}
                              {course.faculty_name && ` (${course.faculty_name})`}
                            </option>
                          ))}
                        </select>
                        {selectedCourse && hasRatedCourse(selectedCourse) && (
                          <div className="text-warning small mt-1">
                            <i className="fas fa-exclamation-triangle me-1"></i>
                            You have already rated this course
                          </div>
                        )}
                      </div>
                    )}

                    {/* Rating Stars */}
                    <div className="mb-3">
                      <label className="form-label fw-bold">Rating *</label>
                      <div className="d-flex align-items-center mb-2">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            type="button"
                            className="btn btn-link p-1"
                            onClick={() => setRating(star)}
                            disabled={submitting}
                          >
                            <i
                              className={`fas fa-star fa-2x ${
                                star <= rating ? 'text-warning' : 'text-muted'
                              }`}
                            ></i>
                          </button>
                        ))}
                        <span className="ms-3 fw-bold fs-5 text-primary">
                          {rating}/5
                        </span>
                      </div>
                      <div className="text-muted small">
                        {rating === 5 && '⭐️⭐️⭐️⭐️⭐️ Excellent - Outstanding performance'}
                        {rating === 4 && '⭐️⭐️⭐️⭐️ Very Good - Above expectations'}
                        {rating === 3 && '⭐️⭐️⭐️ Good - Meets expectations'}
                        {rating === 2 && '⭐️⭐️ Fair - Below expectations'}
                        {rating === 1 && '⭐️ Poor - Unsatisfactory'}
                      </div>
                    </div>

                    {/* Comment */}
                    <div className="mb-4">
                      <label className="form-label fw-bold">Comment (optional)</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder={`Share your experience with this ${ratingType === 'lecturer' ? 'lecturer' : 'course'}...`}
                        disabled={submitting}
                        maxLength={500}
                      ></textarea>
                      <div className="form-text text-end">
                        {comment.length}/500 characters
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      className="btn btn-primary w-100 py-2"
                      disabled={
                        submitting || 
                        !rating ||
                        (ratingType === 'lecturer' && !selectedLecturer) ||
                        (ratingType === 'course' && !selectedCourse) ||
                        (ratingType === 'lecturer' && hasRatedLecturer(selectedLecturer)) ||
                        (ratingType === 'course' && hasRatedCourse(selectedCourse))
                      }
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

            {/* Ratings History */}
            <div className="col-lg-6">
              <div className="card shadow">
                <div className="card-header bg-success text-white d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    <i className="fas fa-history me-2"></i>
                    My Ratings ({myRatings.length})
                  </h5>
                  <button 
                    className="btn btn-sm btn-light"
                    onClick={fetchData}
                    disabled={loading}
                  >
                    <i className="fas fa-sync-alt"></i>
                  </button>
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
                      <h5 className="text-muted">No ratings submitted yet</h5>
                      <p className="text-muted">Start by rating a lecturer or course</p>
                    </div>
                  ) : (
                    <div className="list-group list-group-flush">
                      {myRatings.map((ratingItem) => (
                        <div key={ratingItem.id} className="list-group-item">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div className="flex-grow-1">
                              <h6 className="mb-1 text-primary">
                                {ratingItem.lecturer_name || ratingItem.course_name}
                              </h6>
                              <div className="small text-muted mb-1">
                                <span className="badge bg-info me-2">
                                  {getRatingTypeDisplay(ratingItem)}
                                </span>
                                {ratingItem.course_code && `Course: ${ratingItem.course_code}`}
                              </div>
                            </div>
                            <div className="text-end">
                              <div className="fw-bold text-warning fs-5">
                                {[1, 2, 3, 4, 5].map(star => (
                                  <i
                                    key={star}
                                    className={`fas fa-star ${
                                      star <= ratingItem.rating ? 'text-warning' : 'text-muted'
                                    }`}
                                  ></i>
                                ))}
                                <span className="ms-1">({ratingItem.rating})</span>
                              </div>
                              <small className="text-muted">
                                {ratingItem.created_at ? new Date(ratingItem.created_at).toLocaleDateString() : 'Recent'}
                              </small>
                            </div>
                          </div>
                          
                          {ratingItem.comment && (
                            <div className="bg-light p-3 rounded mt-2">
                              <p className="mb-0 small">
                                <i className="fas fa-comment text-muted me-1"></i>
                                "{ratingItem.comment}"
                              </p>
                            </div>
                          )}
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
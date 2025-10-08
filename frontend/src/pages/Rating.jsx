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
  const [ratingType, setRatingType] = useState('teaching');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { user } = useAuth();

  // Valid rating types for your backend
  const ratingTypes = [
    { value: 'teaching', label: 'Teaching Quality' },
    { value: 'subject_knowledge', label: 'Subject Knowledge' },
    { value: 'communication', label: 'Communication' },
    { value: 'punctuality', label: 'Punctuality' },
    { value: 'overall', label: 'Overall' }
  ];

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

      if (lecturersRes.success) {
        setLecturers(lecturersRes.data || []);
      } else {
        console.warn('Failed to load lecturers:', lecturersRes.message);
        setLecturers([]);
      }

      if (coursesRes.success) {
        setCourses(coursesRes.data || []);
      } else {
        console.warn('Failed to load courses:', coursesRes.message);
        setCourses([]);
      }

      // Fetch user's ratings - with enhanced error handling
      try {
        const ratingsRes = await apiMethods.getMyRatings();
        if (ratingsRes.success) {
          setMyRatings(ratingsRes.data || []);
        } else {
          console.warn('Could not load ratings:', ratingsRes.message);
          setMyRatings([]);
          // Don't show error to user for ratings, as it's not critical
        }
      } catch (ratingsError) {
        console.warn('Could not load ratings:', ratingsError);
        setMyRatings([]);
        // Don't set error state for ratings failure
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
    
    // Enhanced validation
    if (!selectedLecturer) {
      setError('Please select a lecturer');
      return;
    }

    if (!selectedCourse) {
      setError('Please select a course');
      return;
    }

    if (!rating) {
      setError('Please select a rating');
      return;
    }

    if (!ratingType) {
      setError('Please select a rating type');
      return;
    }

    // Check if user has already rated this specific combination
    if (hasRatedSpecific(selectedLecturer, selectedCourse, ratingType)) {
      setError(`You have already submitted a ${ratingTypes.find(t => t.value === ratingType)?.label.toLowerCase()} rating for ${getLecturerName(selectedLecturer)} and ${getCourseName(selectedCourse)}`);
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // Prepare rating data according to your database schema
      const ratingData = {
        rating: Number(rating),
        comment: comment.trim() || '',
        rating_type: ratingType,
        lecturer_id: parseInt(selectedLecturer),
        course_id: parseInt(selectedCourse)
      };

      console.log('📊 Submitting rating (frontend):', ratingData);

      // Enhanced validation
      const requiredFields = ['rating', 'rating_type', 'lecturer_id', 'course_id'];
      const missingFields = requiredFields.filter(field => !ratingData[field] && ratingData[field] !== 0);
      
      if (missingFields.length > 0) {
        setError(`Missing required fields: ${missingFields.join(', ')}`);
        setSubmitting(false);
        return;
      }

      // Validate field types
      if (typeof ratingData.rating !== 'number' || ratingData.rating < 1 || ratingData.rating > 5) {
        setError('Rating must be a number between 1 and 5');
        setSubmitting(false);
        return;
      }

      if (typeof ratingData.lecturer_id !== 'number' || ratingData.lecturer_id <= 0) {
        setError('Invalid lecturer selected');
        setSubmitting(false);
        return;
      }

      if (typeof ratingData.course_id !== 'number' || ratingData.course_id <= 0) {
        setError('Invalid course selected');
        setSubmitting(false);
        return;
      }

      const response = await apiMethods.submitRating(ratingData);

      if (response.success) {
        setSuccess('Rating submitted successfully!');
        // Reset form
        setSelectedLecturer('');
        setSelectedCourse('');
        setRating(5);
        setComment('');
        setRatingType('teaching');
        // Refresh ratings
        fetchData();
      } else {
        // Enhanced error messages
        let errorMessage = response.message || 'Failed to submit rating';
        
        if (response.status === 409) {
          errorMessage = `You have already submitted a ${ratingType.replace('_', ' ')} rating for this lecturer and course.`;
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
    setRatingType('teaching');
    setError('');
    setSuccess('');
  };

  // Check if user has already rated this lecturer/course combination for any rating type
  const hasRated = (lecturerId, courseId) => {
    return myRatings.some(rating => 
      rating.lecturer_id == lecturerId && 
      rating.course_id == courseId
    );
  };

  // Check if user has rated this specific lecturer/course/rating_type combination
  const hasRatedSpecific = (lecturerId, courseId, type) => {
    return myRatings.some(rating => 
      rating.lecturer_id == lecturerId && 
      rating.course_id == courseId &&
      rating.rating_type === type
    );
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
            Rate Your Lecturers & Courses
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
                    {/* Lecturer Selection */}
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
                    </div>

                    {/* Course Selection */}
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
                    </div>

                    {/* Rating Type */}
                    <div className="mb-3">
                      <label className="form-label fw-bold">Rating Category *</label>
                      <select
                        className="form-select"
                        value={ratingType}
                        onChange={(e) => setRatingType(e.target.value)}
                        required
                        disabled={submitting}
                      >
                        <option value="">Select rating category</option>
                        {ratingTypes.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

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
                        placeholder="Share your experience with this lecturer and course..."
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
                        !selectedLecturer || 
                        !selectedCourse ||
                        !ratingType ||
                        hasRatedSpecific(selectedLecturer, selectedCourse, ratingType)
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

                    {/* Already rated warning */}
                    {selectedLecturer && selectedCourse && ratingType && 
                     hasRatedSpecific(selectedLecturer, selectedCourse, ratingType) && (
                      <div className="alert alert-warning mt-3 mb-0 py-2">
                        <i className="fas fa-exclamation-triangle me-2"></i>
                        You have already rated {getLecturerName(selectedLecturer)} for {getCourseName(selectedCourse)} in {ratingTypes.find(t => t.value === ratingType)?.label}
                      </div>
                    )}
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
                      <p className="text-muted">Start by rating a lecturer and course</p>
                    </div>
                  ) : (
                    <div className="list-group list-group-flush">
                      {myRatings.map((ratingItem) => (
                        <div key={ratingItem.id} className="list-group-item">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div className="flex-grow-1">
                              <h6 className="mb-1 text-primary">
                                {ratingItem.lecturer_name} - {ratingItem.course_name}
                              </h6>
                              <div className="small text-muted mb-1">
                                <span className="badge bg-info text-capitalize me-2">
                                  {ratingItem.rating_type?.replace('_', ' ') || 'Rating'}
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
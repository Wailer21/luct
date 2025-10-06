import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/auth';
import { apiMethods } from '../utils/api';

export default function Rating() {
  const [classes, setClasses] = useState([]);
  const [myRatings, setMyRatings] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null); // Changed to store entire class object
  const [rating, setRating] = useState(5); // Changed to numeric
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { user } = useAuth();

  // Numeric rating options with text labels
  const ratingOptions = [
    { value: 5, label: 'Excellent', description: 'Outstanding performance', emoji: '⭐️⭐️⭐️⭐️⭐️' },
    { value: 4, label: 'Very Good', description: 'Above expectations', emoji: '⭐️⭐️⭐️⭐️' },
    { value: 3, label: 'Good', description: 'Meets expectations', emoji: '⭐️⭐️⭐️' },
    { value: 2, label: 'Fair', description: 'Below expectations', emoji: '⭐️⭐️' },
    { value: 1, label: 'Poor', description: 'Unsatisfactory', emoji: '⭐️' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const classesRes = await apiMethods.getClasses();

      if (classesRes.success) setClasses(classesRes.data || []);

      // Try to get ratings, but don't fail if it errors
      try {
        const ratingsRes = user?.role === 'Lecturer' 
          ? await apiMethods.getLecturerRatings()
          : await apiMethods.getMyRatings();
        
        if (ratingsRes.success) setMyRatings(ratingsRes.data || []);
      } catch (ratingsError) {
        console.warn('Could not load ratings:', ratingsError);
        setMyRatings([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load some data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!selectedClass) {
      setError('Please select a class');
      return;
    }

    if (!rating) {
      setError('Please select a rating');
      return;
    }

    // Validate that lecturer_id exists
    if (!selectedClass.lecturer_id) {
      setError('Selected class does not have a valid lecturer. Please contact administrator.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // Prepare rating data with NUMERIC rating and all required fields
      const ratingData = {
        rating: rating, // This is now numeric: 1, 2, 3, 4, or 5
        comment: comment.trim(),
        class_name: selectedClass.class_name,
        rating_type: 'class_rating',
        lecturer_id: selectedClass.lecturer_id,
        course_id: selectedClass.course_id
      };

      console.log('Submitting rating data:', ratingData);

      // Validate all required fields are present
      const requiredFields = ['rating', 'class_name', 'rating_type', 'lecturer_id'];
      const missingFields = requiredFields.filter(field => !ratingData[field]);
      
      if (missingFields.length > 0) {
        setError(`Missing required fields: ${missingFields.join(', ')}`);
        setSubmitting(false);
        return;
      }

      const response = await fetch('https://luct-7.onrender.com/api/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(ratingData)
      });

      const responseData = await response.json();
      console.log('Backend response:', responseData);

      if (response.ok && responseData.success) {
        setSuccess('Rating submitted successfully!');
        setRating(5);
        setComment('');
        setSelectedClass(null);
        fetchData(); // Refresh ratings
      } else {
        setError(responseData.message || `Error: ${response.status} ${response.statusText}`);
        
        // If it's a rating type issue, try alternative rating types
        if (responseData.message && responseData.message.includes('rating type')) {
          tryAlternativeRatingTypes(ratingData);
          return;
        }
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      setError(error.message || 'Failed to submit rating. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Function to try alternative rating types if the first one fails
  const tryAlternativeRatingTypes = async (baseRatingData) => {
    const alternativeTypes = ['teaching', 'general', 'overall', 'content', 'class'];
    
    for (const ratingType of alternativeTypes) {
      try {
        console.log(`Trying rating type: ${ratingType}`);
        
        const ratingDataWithNewType = {
          ...baseRatingData,
          rating_type: ratingType
        };

        const response = await fetch('https://luct-7.onrender.com/api/ratings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(ratingDataWithNewType)
        });

        const responseData = await response.json();
        console.log(`Tried ${ratingType}:`, responseData);

        if (response.ok && responseData.success) {
          setSuccess(`Rating submitted successfully with type: ${ratingType}`);
          setRating(5);
          setComment('');
          setSelectedClass(null);
          fetchData();
          return; // Success, exit the loop
        }
      } catch (error) {
        console.error(`Error with rating type ${ratingType}:`, error);
      }
    }
    
    // If we get here, all rating types failed
    setError('All rating type attempts failed. Please try again later.');
  };

  const hasRated = (className) => {
    return myRatings.some(rating => rating.class_name === className);
  };

  const resetForm = () => {
    setSelectedClass(null);
    setRating(5);
    setComment('');
    setError('');
    setSuccess('');
  };

  // Get class display name with lecturer and course info
  const getClassDisplayName = (classItem) => {
    return `${classItem.class_name} (${classItem.course_name} - ${classItem.lecturer_name})`;
  };

  // Handle class selection change
  const handleClassChange = (e) => {
    const selectedClassName = e.target.value;
    if (selectedClassName) {
      const classObj = classes.find(cls => cls.class_name === selectedClassName);
      setSelectedClass(classObj);
    } else {
      setSelectedClass(null);
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <h2 className="text-primary mb-4">
            <i className="fas fa-star me-2"></i>
            Class Ratings
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
            <div className="col-lg-6 mb-4">
              <div className="card shadow">
                <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    <i className="fas fa-plus-circle me-2"></i>
                    Rate a Class
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
                    <div className="mb-3">
                      <label className="form-label fw-bold">Select Class:</label>
                      <select
                        className="form-select"
                        value={selectedClass ? selectedClass.class_name : ''}
                        onChange={handleClassChange}
                        required
                        disabled={submitting}
                      >
                        <option value="">Choose a class to rate</option>
                        {classes.map(classItem => (
                          <option key={classItem.id} value={classItem.class_name}>
                            {getClassDisplayName(classItem)}
                            {!classItem.lecturer_id && ' (No Lecturer)'}
                          </option>
                        ))}
                      </select>
                      {selectedClass && !selectedClass.lecturer_id && (
                        <div className="text-danger mt-2">
                          <i className="fas fa-exclamation-triangle me-1"></i>
                          <small>This class has no lecturer assigned and cannot be rated</small>
                        </div>
                      )}
                      {selectedClass && hasRated(selectedClass.class_name) && (
                        <div className="text-warning mt-2">
                          <i className="fas fa-exclamation-triangle me-1"></i>
                          <small>You have already rated this class</small>
                        </div>
                      )}
                    </div>

                    <div className="mb-4">
                      <label className="form-label fw-bold">Rating:</label>
                      <div className="rating-options">
                        {ratingOptions.map((option) => (
                          <div key={option.value} className="form-check mb-2">
                            <input
                              className="form-check-input"
                              type="radio"
                              name="rating"
                              id={`rating-${option.value}`}
                              value={option.value}
                              checked={rating === option.value}
                              onChange={(e) => setRating(parseInt(e.target.value))}
                              disabled={submitting}
                            />
                            <label 
                              className="form-check-label d-flex align-items-center w-100" 
                              htmlFor={`rating-${option.value}`}
                            >
                              <span className="me-3 fs-5">{option.emoji}</span>
                              <div className="flex-grow-1">
                                <strong className="d-block">{option.label}</strong>
                                <small className="text-muted">{option.description}</small>
                              </div>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="form-label fw-bold">Comment (optional):</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Share your experience with this class..."
                        disabled={submitting}
                        maxLength={500}
                      ></textarea>
                      <div className="form-text text-end">
                        {comment.length}/500 characters
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary w-100 py-2"
                      disabled={
                        submitting || 
                        !selectedClass || 
                        !selectedClass.lecturer_id ||
                        hasRated(selectedClass.class_name)
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

                    {selectedClass && hasRated(selectedClass.class_name) && (
                      <div className="alert alert-warning mt-3 mb-0 py-2">
                        <i className="fas fa-info-circle me-2"></i>
                        You can only rate each class once
                      </div>
                    )}
                  </form>
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="card shadow">
                <div className="card-header bg-success text-white">
                  <h5 className="mb-0">
                    <i className="fas fa-history me-2"></i>
                    My Class Ratings ({myRatings.length})
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
                      <h5 className="text-muted">No ratings submitted yet</h5>
                      <p className="text-muted">Start by rating one of your classes</p>
                    </div>
                  ) : (
                    <div className="list-group list-group-flush">
                      {myRatings.map((ratingItem) => (
                        <div key={ratingItem.id} className="list-group-item">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                              <h6 className="mb-1 text-primary">
                                {ratingItem.class_name}
                              </h6>
                              <div className="small text-muted mb-1">
                                {ratingItem.course_name} - {ratingItem.lecturer_name}
                              </div>
                              <span className="badge bg-info me-2">
                                {ratingItem.rating_type || 'Class Rating'}
                              </span>
                            </div>
                            <small className="text-muted">
                              {ratingItem.created_at ? new Date(ratingItem.created_at).toLocaleDateString() : 'Recent'}
                            </small>
                          </div>
                          
                          <div className="mb-2">
                            <span className={`badge ${
                              ratingItem.rating >= 4.5 ? 'bg-success' :
                              ratingItem.rating >= 3.5 ? 'bg-primary' :
                              ratingItem.rating >= 2.5 ? 'bg-info' :
                              ratingItem.rating >= 1.5 ? 'bg-warning' : 'bg-danger'
                            } fs-6`}>
                              {typeof ratingItem.rating === 'number' ? ratingItem.rating.toFixed(1) : ratingItem.rating}
                            </span>
                          </div>
                          
                          {ratingItem.comment && (
                            <div className="bg-light p-2 rounded">
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
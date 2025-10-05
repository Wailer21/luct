import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/auth';
import { apiMethods } from '../utils/api';

export default function ReportForm() {
  const [formData, setFormData] = useState({
    faculty_id: '',
    class_name: '',
    week_of_reporting: '',
    lecture_date: '',
    course_id: '',
    actual_present: '',
    total_registered: '',
    venue: '',
    scheduled_time: '',
    topic: '',
    learning_outcomes: '',
    recommendations: ''
  });
  const [faculties, setFaculties] = useState([]);
  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      console.log('🔄 Fetching initial data...');
      setInitialLoading(true);
      
      const [facultiesRes, coursesRes, classesRes] = await Promise.all([
        apiMethods.getFaculties(),
        apiMethods.getCourses(),
        user?.role === 'Lecturer' ? apiMethods.getMyClasses() : Promise.resolve({ success: true, data: [] })
      ]);

      if (facultiesRes.success) {
        setFaculties(facultiesRes.data);
        console.log('✅ Faculties loaded:', facultiesRes.data.length);
      } else {
        throw new Error(facultiesRes.message || 'Failed to load faculties');
      }

      if (coursesRes.success) {
        setCourses(coursesRes.data);
        console.log('✅ Courses loaded:', coursesRes.data.length);
      } else {
        throw new Error(coursesRes.message || 'Failed to load courses');
      }

      if (classesRes.success) {
        setClasses(classesRes.data);
        console.log('✅ Classes loaded:', classesRes.data.length);
      }

    } catch (error) {
      console.error('❌ Error fetching data:', error);
      setError(`Failed to load form data: ${error.message}. Please refresh the page.`);
    } finally {
      setInitialLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    const requiredFields = ['faculty_id', 'class_name', 'week_of_reporting', 'lecture_date', 'course_id', 'actual_present'];
    
    requiredFields.forEach(field => {
      if (!formData[field]) {
        errors[field] = 'This field is required';
      }
    });

    // Class name format validation
    if (formData.class_name && !formData.class_name.match(/^[A-Z]{3,}[A-Z0-9]*-\w+$/)) {
      errors.class_name = 'Class name must be in format: ProgramCodeYear-Group (e.g., BSCSEM1-A, BSCITY2-B)';
    }

    // Week validation
    if (formData.week_of_reporting) {
      const weekNum = parseInt(formData.week_of_reporting);
      if (isNaN(weekNum) || weekNum < 1 || weekNum > 52) {
        errors.week_of_reporting = 'Week must be a number between 1 and 52';
      }
    }

    // Date validation
    if (formData.lecture_date) {
      const lectureDate = new Date(formData.lecture_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (lectureDate > today) {
        errors.lecture_date = 'Lecture date cannot be in the future';
      }
    }

    // Attendance validation
    if (formData.actual_present && formData.total_registered) {
      const present = parseInt(formData.actual_present);
      const registered = parseInt(formData.total_registered);
      if (present > registered) {
        errors.actual_present = 'Students present cannot exceed total registered';
      }
    }

    if (formData.actual_present && parseInt(formData.actual_present) < 0) {
      errors.actual_present = 'Students present cannot be negative';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear validation error for this field when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    setError('');
    setSuccess('');
  };

  const handleClassSelect = (className) => {
    setFormData(prev => ({
      ...prev,
      class_name: className
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!validateForm()) {
      setLoading(false);
      setError('Please fix the validation errors before submitting.');
      return;
    }

    try {
      const submissionData = {
        ...formData,
        // lecturer_id is automatically set by backend from auth token
      };
      
      console.log('📤 Submitting report:', submissionData);
      
      const response = await apiMethods.createReport(submissionData);
      
      if (response.success) {
        setSuccess('Report submitted successfully! Redirecting to reports...');
        
        // Reset form
        setFormData({
          faculty_id: '',
          class_name: '',
          week_of_reporting: '',
          lecture_date: '',
          course_id: '',
          actual_present: '',
          total_registered: '',
          venue: '',
          scheduled_time: '',
          topic: '',
          learning_outcomes: '',
          recommendations: ''
        });
        
        // Redirect after delay
        setTimeout(() => {
          navigate('/reports');
        }, 2000);
      } else {
        setError(response.message || 'Failed to submit report. Please try again.');
      }
    } catch (err) {
      console.error('❌ Report submission error:', err);
      
      if (err.message) {
        setError(`Submission failed: ${err.message}`);
      } else if (err.data && err.data.message) {
        setError(`Submission failed: ${err.data.message}`);
      } else {
        setError('An error occurred while submitting the report. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateAttendanceRate = () => {
    if (formData.actual_present && formData.total_registered) {
      const present = parseInt(formData.actual_present);
      const registered = parseInt(formData.total_registered);
      if (registered > 0) {
        return ((present / registered) * 100).toFixed(1);
      }
    }
    return 0;
  };

  const getCurrentWeek = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now - start;
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    return Math.floor(diff / oneWeek) + 1;
  };

  const fillCurrentWeek = () => {
    setFormData(prev => ({
      ...prev,
      week_of_reporting: getCurrentWeek().toString()
    }));
  };

  const fillTodayDate = () => {
    const today = new Date().toISOString().split('T')[0];
    setFormData(prev => ({
      ...prev,
      lecture_date: today
    }));
  };

  if (user?.role !== 'Lecturer') {
    return (
      <div className="container-fluid py-4">
        <div className="row">
          <div className="col-12">
            <div className="alert alert-danger">
              <i className="fas fa-exclamation-triangle me-2"></i>
              Access denied. Only lecturers can submit reports.
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (initialLoading) {
    return (
      <div className="container-fluid py-4">
        <div className="row">
          <div className="col-12">
            <div className="card shadow">
              <div className="card-body text-center py-5">
                <div className="spinner-border text-primary mb-3" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p>Loading form data...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const attendanceRate = calculateAttendanceRate();

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <div className="card shadow">
            <div className="card-header bg-primary text-white">
              <div className="d-flex justify-content-between align-items-center">
                <h3 className="mb-0">
                  <i className="fas fa-plus-circle me-2"></i>
                  Submit Lecture Report
                </h3>
                <button
                  type="button"
                  className="btn btn-light btn-sm"
                  onClick={() => navigate('/reports')}
                >
                  <i className="fas fa-arrow-left me-1"></i>
                  Back to Reports
                </button>
              </div>
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

              <form onSubmit={handleSubmit}>
                {/* Basic Information Section */}
                <div className="row mb-4">
                  <div className="col-12">
                    <h5 className="text-primary mb-3">
                      <i className="fas fa-info-circle me-2"></i>
                      Basic Information
                    </h5>
                  </div>

                  <div className="col-md-6 mb-3">
                    <label htmlFor="faculty_id" className="form-label">
                      Faculty *
                    </label>
                    <select
                      className={`form-select ${validationErrors.faculty_id ? 'is-invalid' : ''}`}
                      id="faculty_id"
                      name="faculty_id"
                      value={formData.faculty_id}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    >
                      <option value="">Select Faculty</option>
                      {faculties.map(faculty => (
                        <option key={faculty.id} value={faculty.id}>
                          {faculty.name}
                        </option>
                      ))}
                    </select>
                    {validationErrors.faculty_id && (
                      <div className="invalid-feedback">{validationErrors.faculty_id}</div>
                    )}
                  </div>

                  <div className="col-md-6 mb-3">
                    <label htmlFor="class_name" className="form-label">
                      Class Name *
                    </label>
                    <input
                      type="text"
                      className={`form-control ${validationErrors.class_name ? 'is-invalid' : ''}`}
                      id="class_name"
                      name="class_name"
                      value={formData.class_name}
                      onChange={handleChange}
                      placeholder="Enter class name (e.g., BSCSEM1-A)"
                      required
                      disabled={loading}
                    />
                    {validationErrors.class_name ? (
                      <div className="invalid-feedback">{validationErrors.class_name}</div>
                    ) : (
                      <div className="form-text">
                        Format: ProgramCodeYear-Group (e.g., BSCSEM1-A, BSCITY2-B)
                      </div>
                    )}
                    
                    {/* Quick class selection from my classes */}
                    {classes.length > 0 && (
                      <div className="mt-2">
                        <small className="text-muted">Quick select from your classes:</small>
                        <div className="d-flex flex-wrap gap-1 mt-1">
                          {classes.map(cls => (
                            <button
                              key={cls.id}
                              type="button"
                              className="btn btn-outline-secondary btn-sm"
                              onClick={() => handleClassSelect(cls.class_name)}
                            >
                              {cls.class_name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Lecture Details Section */}
                <div className="row mb-4">
                  <div className="col-12">
                    <h5 className="text-primary mb-3">
                      <i className="fas fa-calendar-alt me-2"></i>
                      Lecture Details
                    </h5>
                  </div>

                  <div className="col-md-4 mb-3">
                    <label htmlFor="week_of_reporting" className="form-label">
                      Week of Reporting *
                    </label>
                    <div className="input-group">
                      <input
                        type="number"
                        className={`form-control ${validationErrors.week_of_reporting ? 'is-invalid' : ''}`}
                        id="week_of_reporting"
                        name="week_of_reporting"
                        value={formData.week_of_reporting}
                        onChange={handleChange}
                        min="1"
                        max="52"
                        placeholder="Enter week number"
                        required
                        disabled={loading}
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={fillCurrentWeek}
                        title="Fill current week"
                      >
                        <i className="fas fa-magic"></i>
                      </button>
                    </div>
                    {validationErrors.week_of_reporting && (
                      <div className="invalid-feedback">{validationErrors.week_of_reporting}</div>
                    )}
                  </div>

                  <div className="col-md-4 mb-3">
                    <label htmlFor="lecture_date" className="form-label">
                      Lecture Date *
                    </label>
                    <div className="input-group">
                      <input
                        type="date"
                        className={`form-control ${validationErrors.lecture_date ? 'is-invalid' : ''}`}
                        id="lecture_date"
                        name="lecture_date"
                        value={formData.lecture_date}
                        onChange={handleChange}
                        required
                        disabled={loading}
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={fillTodayDate}
                        title="Fill today's date"
                      >
                        <i className="fas fa-calendar-day"></i>
                      </button>
                    </div>
                    {validationErrors.lecture_date && (
                      <div className="invalid-feedback">{validationErrors.lecture_date}</div>
                    )}
                  </div>

                  <div className="col-md-4 mb-3">
                    <label htmlFor="course_id" className="form-label">
                      Course *
                    </label>
                    <select
                      className={`form-select ${validationErrors.course_id ? 'is-invalid' : ''}`}
                      id="course_id"
                      name="course_id"
                      value={formData.course_id}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    >
                      <option value="">Select Course</option>
                      {courses.map(course => (
                        <option key={course.id} value={course.id}>
                          {course.code} - {course.course_name}
                        </option>
                      ))}
                    </select>
                    {validationErrors.course_id && (
                      <div className="invalid-feedback">{validationErrors.course_id}</div>
                    )}
                  </div>
                </div>

                {/* Attendance Section */}
                <div className="row mb-4">
                  <div className="col-12">
                    <h5 className="text-primary mb-3">
                      <i className="fas fa-users me-2"></i>
                      Attendance Information
                    </h5>
                  </div>

                  <div className="col-md-4 mb-3">
                    <label htmlFor="actual_present" className="form-label">
                      Students Present *
                    </label>
                    <input
                      type="number"
                      className={`form-control ${validationErrors.actual_present ? 'is-invalid' : ''}`}
                      id="actual_present"
                      name="actual_present"
                      value={formData.actual_present}
                      onChange={handleChange}
                      min="0"
                      required
                      disabled={loading}
                    />
                    {validationErrors.actual_present && (
                      <div className="invalid-feedback">{validationErrors.actual_present}</div>
                    )}
                  </div>

                  <div className="col-md-4 mb-3">
                    <label htmlFor="total_registered" className="form-label">
                      Total Registered
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      id="total_registered"
                      name="total_registered"
                      value={formData.total_registered}
                      onChange={handleChange}
                      min="0"
                      disabled={loading}
                    />
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label">Attendance Rate</label>
                    <div className="form-control bg-light">
                      <div className="d-flex justify-content-between align-items-center">
                        <span>{attendanceRate}%</span>
                        {attendanceRate > 0 && (
                          <span className={`badge ${attendanceRate >= 80 ? 'bg-success' : attendanceRate >= 60 ? 'bg-warning' : 'bg-danger'}`}>
                            {attendanceRate >= 80 ? 'Good' : attendanceRate >= 60 ? 'Fair' : 'Low'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Location & Time Section */}
                <div className="row mb-4">
                  <div className="col-12">
                    <h5 className="text-primary mb-3">
                      <i className="fas fa-map-marker-alt me-2"></i>
                      Location & Time
                    </h5>
                  </div>

                  <div className="col-md-6 mb-3">
                    <label htmlFor="venue" className="form-label">Venue</label>
                    <input
                      type="text"
                      className="form-control"
                      id="venue"
                      name="venue"
                      value={formData.venue}
                      onChange={handleChange}
                      placeholder="Lecture venue or room number"
                      disabled={loading}
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label htmlFor="scheduled_time" className="form-label">Scheduled Time</label>
                    <input
                      type="time"
                      className="form-control"
                      id="scheduled_time"
                      name="scheduled_time"
                      value={formData.scheduled_time}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Academic Content Section */}
                <div className="row mb-4">
                  <div className="col-12">
                    <h5 className="text-primary mb-3">
                      <i className="fas fa-book me-2"></i>
                      Academic Content
                    </h5>
                  </div>

                  <div className="col-12 mb-3">
                    <label htmlFor="topic" className="form-label">Lecture Topic</label>
                    <input
                      type="text"
                      className="form-control"
                      id="topic"
                      name="topic"
                      value={formData.topic}
                      onChange={handleChange}
                      placeholder="Topic covered in this lecture"
                      disabled={loading}
                    />
                  </div>

                  <div className="col-12 mb-3">
                    <label htmlFor="learning_outcomes" className="form-label">Learning Outcomes</label>
                    <textarea
                      className="form-control"
                      id="learning_outcomes"
                      name="learning_outcomes"
                      value={formData.learning_outcomes}
                      onChange={handleChange}
                      rows="3"
                      placeholder="Key learning outcomes achieved in this session..."
                      disabled={loading}
                    ></textarea>
                    <div className="form-text">
                      Describe what students should be able to do after this lecture
                    </div>
                  </div>

                  <div className="col-12 mb-3">
                    <label htmlFor="recommendations" className="form-label">Recommendations & Follow-up</label>
                    <textarea
                      className="form-control"
                      id="recommendations"
                      name="recommendations"
                      value={formData.recommendations}
                      onChange={handleChange}
                      rows="3"
                      placeholder="Any recommendations, follow-up actions, or areas for improvement..."
                      disabled={loading}
                    ></textarea>
                    <div className="form-text">
                      Suggestions for next steps, additional resources, or improvements
                    </div>
                  </div>
                </div>

                {/* Submit Section */}
                <div className="row">
                  <div className="col-12">
                    <div className="d-grid gap-2 d-md-flex justify-content-md-end border-top pt-4">
                      <button
                        type="button"
                        className="btn btn-outline-secondary me-md-2"
                        onClick={() => navigate('/reports')}
                        disabled={loading}
                      >
                        <i className="fas fa-times me-2"></i>
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary px-4"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <div className="spinner-border spinner-border-sm me-2" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                            Submitting...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-paper-plane me-2"></i>
                            Submit Report
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
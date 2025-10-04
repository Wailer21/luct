import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/auth';
import { apiMethods } from '../utils/api';

export default function ReportForm() {
  const [formData, setFormData] = useState({
    faculty_id: '',
    class_name: '', // Using class_name
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
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      console.log('🔄 Fetching initial data...');
      
      const facultiesRes = await apiMethods.getFaculties();
      if (facultiesRes.success) {
        setFaculties(facultiesRes.data);
        console.log('✅ Faculties loaded:', facultiesRes.data.length);
      }

      const coursesRes = await apiMethods.getCourses();
      if (coursesRes.success) {
        setCourses(coursesRes.data);
        console.log('✅ Courses loaded:', coursesRes.data.length);
      }

      if (user?.role === 'Lecturer') {
        const classesRes = await apiMethods.getMyClasses();
        if (classesRes.success) {
          setClasses(classesRes.data);
          console.log('✅ Classes loaded:', classesRes.data.length);
        }
      }

    } catch (error) {
      console.error('❌ Error fetching data:', error);
      setError('Failed to load form data. Please refresh the page.');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validate required fields
    const requiredFields = ['faculty_id', 'class_name', 'week_of_reporting', 'lecture_date', 'course_id', 'actual_present'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
      setLoading(false);
      return;
    }

    try {
      // Include lecturer_id from authenticated user
      const submissionData = {
        ...formData,
        lecturer_id: user?.id
      };
      
      console.log('📤 Submitting report:', submissionData);
      
      const response = await apiMethods.createReport(submissionData);
      
      if (response.success) {
        setSuccess('Report submitted successfully!');
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
        setTimeout(() => {
          navigate('/reports');
        }, 2000);
      } else {
        setError(response.message || 'Failed to submit report');
      }
    } catch (err) {
      console.error('❌ Report submission error:', err);
      
      if (err.data && err.data.message) {
        setError(`Submission failed: ${err.data.message}`);
      } else {
        setError('An error occurred while submitting the report. Please try again.');
      }
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <div className="card shadow">
            <div className="card-header bg-primary text-white">
              <h3 className="mb-0">
                <i className="fas fa-plus-circle me-2"></i>
                Submit Lecture Report
              </h3>
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
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="faculty_id" className="form-label">
                      Faculty *
                    </label>
                    <select
                      className="form-select"
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
                  </div>

                  <div className="col-md-6 mb-3">
                    <label htmlFor="class_name" className="form-label">
                      Class Name *
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="class_name"
                      name="class_name"
                      value={formData.class_name}
                      onChange={handleChange}
                      placeholder="Enter class name (e.g., BSCSEM1-A)"
                      required
                      disabled={loading}
                    />
                    <div className="form-text">
                      Format: ProgramCodeYear-Group (e.g., BSCSEM1-A, BSCITY2-B)
                    </div>
                  </div>
                </div>

                {/* Rest of your form remains the same */}
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <label htmlFor="week_of_reporting" className="form-label">
                      Week of Reporting *
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      id="week_of_reporting"
                      name="week_of_reporting"
                      value={formData.week_of_reporting}
                      onChange={handleChange}
                      min="1"
                      max="52"
                      placeholder="Enter week number (1-52)"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="col-md-4 mb-3">
                    <label htmlFor="lecture_date" className="form-label">
                      Lecture Date *
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      id="lecture_date"
                      name="lecture_date"
                      value={formData.lecture_date}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="col-md-4 mb-3">
                    <label htmlFor="course_id" className="form-label">
                      Course *
                    </label>
                    <select
                      className="form-select"
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
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="actual_present" className="form-label">
                      Students Present *
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      id="actual_present"
                      name="actual_present"
                      value={formData.actual_present}
                      onChange={handleChange}
                      min="0"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="col-md-6 mb-3">
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
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="venue" className="form-label">Venue</label>
                    <input
                      type="text"
                      className="form-control"
                      id="venue"
                      name="venue"
                      value={formData.venue}
                      onChange={handleChange}
                      placeholder="Lecture venue"
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

                <div className="mb-3">
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

                <div className="mb-3">
                  <label htmlFor="learning_outcomes" className="form-label">Learning Outcomes</label>
                  <textarea
                    className="form-control"
                    id="learning_outcomes"
                    name="learning_outcomes"
                    value={formData.learning_outcomes}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Key learning outcomes achieved"
                    disabled={loading}
                  ></textarea>
                </div>

                <div className="mb-4">
                  <label htmlFor="recommendations" className="form-label">Recommendations</label>
                  <textarea
                    className="form-control"
                    id="recommendations"
                    name="recommendations"
                    value={formData.recommendations}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Any recommendations or follow-up actions"
                    disabled={loading}
                  ></textarea>
                </div>

                <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                  <button
                    type="button"
                    className="btn btn-secondary me-md-2"
                    onClick={() => navigate('/reports')}
                    disabled={loading}
                  >
                    <i className="fas fa-times me-2"></i>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
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
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
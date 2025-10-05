import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/auth';
import { apiMethods } from '../utils/api';

export default function Rating() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const coursesRes = await apiMethods.getCourses();
      if (coursesRes.success) setCourses(coursesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <h2 className="text-primary mb-4">
            <i className="fas fa-star me-2"></i>
            Course Information
          </h2>

          <div className="row">
            <div className="col-12">
              <div className="card shadow">
                <div className="card-header bg-primary text-white">
                  <h5 className="mb-0">
                    <i className="fas fa-book me-2"></i>
                    Available Courses
                  </h5>
                </div>
                <div className="card-body">
                  {loading ? (
                    <div className="text-center py-4">
                      <div className="spinner-border text-primary"></div>
                      <p className="mt-2">Loading courses...</p>
                    </div>
                  ) : courses.length === 0 ? (
                    <div className="text-center py-5">
                      <i className="fas fa-book fa-3x text-muted mb-3"></i>
                      <h5 className="text-muted">No courses available</h5>
                      <p className="text-muted">Courses will appear here once added to the system</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-striped">
                        <thead>
                          <tr>
                            <th>Course Code</th>
                            <th>Course Name</th>
                            <th>Faculty</th>
                            <th>Total Registered</th>
                          </tr>
                        </thead>
                        <tbody>
                          {courses.map((course) => (
                            <tr key={course.id}>
                              <td>
                                <strong>{course.code}</strong>
                              </td>
                              <td>{course.course_name}</td>
                              <td>{course.faculty_name}</td>
                              <td>
                                <span className="badge bg-info">{course.total_registered || 0}</span>
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
          </div>

          {/* Information Card */}
          <div className="row mt-4">
            <div className="col-12">
              <div className="card shadow">
                <div className="card-header bg-info text-white">
                  <h5 className="mb-0">
                    <i className="fas fa-info-circle me-2"></i>
                    About Course Information
                  </h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6">
                      <h6 className="text-primary">
                        <i className="fas fa-eye me-2"></i>
                        View Available Courses
                      </h6>
                      <p className="text-muted">
                        Browse all courses available in the system with their details including 
                        course codes, names, faculties, and registration numbers.
                      </p>
                    </div>
                    <div className="col-md-6">
                      <h6 className="text-primary">
                        <i className="fas fa-chart-bar me-2"></i>
                        Course Statistics
                      </h6>
                      <p className="text-muted">
                        Monitor course enrollment and track which courses are being offered 
                        across different faculties in the institution.
                      </p>
                    </div>
                  </div>
                  
                  <div className="alert alert-warning mt-3">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    <strong>Note:</strong> This section displays course information. 
                    For detailed analytics and reports, please visit the Analytics section.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
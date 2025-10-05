import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/auth';
import { apiMethods } from '../utils/api';
import { exportAnalyticsToExcel, exportReportsToExcel } from '../utils/excelExport';

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [courses, setCourses] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const { user } = useAuth();

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      // Use existing endpoints that actually work
      const [statsRes, reportsRes, coursesRes, facultiesRes] = await Promise.all([
        apiMethods.getReportStats(),
        apiMethods.getReports(),
        apiMethods.getCourses(),
        apiMethods.getFaculties()
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (reportsRes.success) setReports(reportsRes.data);
      if (coursesRes.success) setCourses(coursesRes.data);
      if (facultiesRes.success) setFaculties(facultiesRes.data);

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate additional analytics from existing data
  const calculateAnalytics = () => {
    if (!stats || reports.length === 0) return null;

    const totalReports = stats.total_reports || reports.length;
    const avgAttendance = stats.avg_attendance || 0;
    const activeLecturers = stats.active_lecturers || 0;
    const coursesCovered = stats.courses_covered || 0;

    // Calculate weekly trends from reports
    const weeklyTrends = reports.reduce((acc, report) => {
      const week = report.week_of_reporting;
      if (!acc[week]) {
        acc[week] = { week, reports: 0, attendance: 0, count: 0 };
      }
      acc[week].reports++;
      if (report.actual_present && report.total_registered) {
        const rate = (report.actual_present / report.total_registered) * 100;
        acc[week].attendance += rate;
        acc[week].count++;
      }
      return acc;
    }, {});

    // Convert to array and calculate averages
    const weeklyTrendsArray = Object.values(weeklyTrends).map(week => ({
      ...week,
      avg_attendance: week.count > 0 ? (week.attendance / week.count).toFixed(1) : 0
    })).sort((a, b) => a.week - b.week);

    // Calculate faculty distribution
    const facultyDistribution = faculties.map(faculty => {
      const facultyReports = reports.filter(report => report.faculty_id === faculty.id);
      return {
        faculty: faculty.name,
        reports: facultyReports.length,
        percentage: ((facultyReports.length / totalReports) * 100).toFixed(1)
      };
    });

    // Calculate course popularity
    const coursePopularity = courses.map(course => {
      const courseReports = reports.filter(report => report.course_id === course.id);
      return {
        course: `${course.code} - ${course.course_name}`,
        reports: courseReports.length,
        faculty: course.faculty_name
      };
    }).sort((a, b) => b.reports - a.reports).slice(0, 10); // Top 10 courses

    return {
      totalReports,
      avgAttendance,
      activeLecturers,
      coursesCovered,
      weeklyTrends: weeklyTrendsArray,
      facultyDistribution,
      coursePopularity,
      totalFaculties: faculties.length,
      totalCourses: courses.length
    };
  };

  const handleExportAnalytics = () => {
    const analytics = calculateAnalytics();
    if (analytics) {
      exportAnalyticsToExcel(analytics);
    }
  };

  const handleExportAllReports = () => {
    exportReportsToExcel(reports);
  };

  if (!['PRL', 'Admin'].includes(user?.role)) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-danger">
          <i className="fas fa-exclamation-triangle me-2"></i>
          Access denied. Analytics requires PRL or Admin role.
        </div>
      </div>
    );
  }

  const analytics = calculateAnalytics();

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="text-primary mb-1">
                <i className="fas fa-chart-bar me-2"></i>
                System Analytics
              </h2>
              <p className="text-muted mb-0">Comprehensive system insights and reports</p>
            </div>
            <div className="d-flex gap-2">
              <button
                className="btn btn-success"
                onClick={handleExportAnalytics}
                disabled={!analytics}
              >
                <i className="fas fa-file-excel me-2"></i>
                Export Analytics
              </button>
              <button
                className="btn btn-info"
                onClick={handleExportAllReports}
                disabled={reports.length === 0}
              >
                <i className="fas fa-file-excel me-2"></i>
                Export All Reports
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="card shadow mb-4">
            <div className="card-header bg-white">
              <ul className="nav nav-tabs card-header-tabs">
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                  >
                    <i className="fas fa-chart-pie me-2"></i>
                    Overview
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'trends' ? 'active' : ''}`}
                    onClick={() => setActiveTab('trends')}
                  >
                    <i className="fas fa-chart-line me-2"></i>
                    Trends
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'faculties' ? 'active' : ''}`}
                    onClick={() => setActiveTab('faculties')}
                  >
                    <i className="fas fa-university me-2"></i>
                    Faculties
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'courses' ? 'active' : ''}`}
                    onClick={() => setActiveTab('courses')}
                  >
                    <i className="fas fa-book me-2"></i>
                    Courses
                  </button>
                </li>
              </ul>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }}></div>
                  <p className="mt-2">Loading analytics...</p>
                </div>
              ) : (
                <>
                  {activeTab === 'overview' && analytics && (
                    <div className="row">
                      <div className="col-md-3 mb-4">
                        <div className="card border-left-primary shadow h-100">
                          <div className="card-body">
                            <div className="d-flex justify-content-between">
                              <div>
                                <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                                  Total Reports
                                </div>
                                <div className="h5 mb-0 font-weight-bold text-gray-800">
                                  {analytics.totalReports}
                                </div>
                              </div>
                              <i className="fas fa-clipboard-list fa-2x text-gray-300"></i>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="col-md-3 mb-4">
                        <div className="card border-left-success shadow h-100">
                          <div className="card-body">
                            <div className="d-flex justify-content-between">
                              <div>
                                <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                                  Avg Attendance
                                </div>
                                <div className="h5 mb-0 font-weight-bold text-gray-800">
                                  {analytics.avgAttendance}%
                                </div>
                              </div>
                              <i className="fas fa-users fa-2x text-gray-300"></i>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="col-md-3 mb-4">
                        <div className="card border-left-info shadow h-100">
                          <div className="card-body">
                            <div className="d-flex justify-content-between">
                              <div>
                                <div className="text-xs font-weight-bold text-info text-uppercase mb-1">
                                  Active Lecturers
                                </div>
                                <div className="h5 mb-0 font-weight-bold text-gray-800">
                                  {analytics.activeLecturers}
                                </div>
                              </div>
                              <i className="fas fa-chalkboard-teacher fa-2x text-gray-300"></i>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="col-md-3 mb-4">
                        <div className="card border-left-warning shadow h-100">
                          <div className="card-body">
                            <div className="d-flex justify-content-between">
                              <div>
                                <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">
                                  Courses Covered
                                </div>
                                <div className="h5 mb-0 font-weight-bold text-gray-800">
                                  {analytics.coursesCovered}
                                </div>
                              </div>
                              <i className="fas fa-book fa-2x text-gray-300"></i>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'trends' && analytics && (
                    <div>
                      <h5 className="mb-4">Weekly Trends</h5>
                      {analytics.weeklyTrends.length > 0 ? (
                        <div className="table-responsive">
                          <table className="table table-striped">
                            <thead>
                              <tr>
                                <th>Week</th>
                                <th>Reports</th>
                                <th>Avg Attendance</th>
                              </tr>
                            </thead>
                            <tbody>
                              {analytics.weeklyTrends.map(week => (
                                <tr key={week.week}>
                                  <td>Week {week.week}</td>
                                  <td>{week.reports}</td>
                                  <td>{week.avg_attendance}%</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <i className="fas fa-chart-line fa-3x text-muted mb-3"></i>
                          <p className="text-muted">No trend data available yet</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'faculties' && analytics && (
                    <div>
                      <h5 className="mb-4">Faculty Distribution</h5>
                      {analytics.facultyDistribution.length > 0 ? (
                        <div className="table-responsive">
                          <table className="table table-striped">
                            <thead>
                              <tr>
                                <th>Faculty</th>
                                <th>Reports</th>
                                <th>Percentage</th>
                              </tr>
                            </thead>
                            <tbody>
                              {analytics.facultyDistribution.map((faculty, index) => (
                                <tr key={index}>
                                  <td>{faculty.faculty}</td>
                                  <td>{faculty.reports}</td>
                                  <td>{faculty.percentage}%</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <i className="fas fa-university fa-3x text-muted mb-3"></i>
                          <p className="text-muted">No faculty data available</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'courses' && analytics && (
                    <div>
                      <h5 className="mb-4">Top Courses by Reports</h5>
                      {analytics.coursePopularity.length > 0 ? (
                        <div className="table-responsive">
                          <table className="table table-striped">
                            <thead>
                              <tr>
                                <th>Course</th>
                                <th>Faculty</th>
                                <th>Reports</th>
                              </tr>
                            </thead>
                            <tbody>
                              {analytics.coursePopularity.map((course, index) => (
                                <tr key={index}>
                                  <td>{course.course}</td>
                                  <td>{course.faculty}</td>
                                  <td>{course.reports}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <i className="fas fa-book fa-3x text-muted mb-3"></i>
                          <p className="text-muted">No course data available</p>
                        </div>
                      )}
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
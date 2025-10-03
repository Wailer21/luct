"use client"

import { useEffect, useState } from "react"
import { useAuth } from "../../utils/auth"
import { apiMethods, API_ENDPOINTS } from "../../utils/api"

export default function StudentMonitoring() {
  const { token, user } = useAuth()
  const [stats, setStats] = useState(null)
  const [attendanceData, setAttendanceData] = useState([])
  const [coursePerformance, setCoursePerformance] = useState([])
  const [recentReports, setRecentReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCourse, setSelectedCourse] = useState("")
  const [timeRange, setTimeRange] = useState("current_semester")

  useEffect(() => {
    if (!token) return
    fetchMonitoringData()
  }, [token, timeRange])

  const fetchMonitoringData = async () => {
    try {
      const [statsRes, attendanceRes, performanceRes, reportsRes] = await Promise.all([
        apiMethods.get(`${API_ENDPOINTS.REPORTS_STATS}?student_id=${user?.id}&time_range=${timeRange}`),
        apiMethods.get(`${API_ENDPOINTS.REPORTS}?student_id=${user?.id}&time_range=${timeRange}`),
        apiMethods.get(`${API_ENDPOINTS.REPORTS}/course-performance?student_id=${user?.id}`),
        apiMethods.get(`${API_ENDPOINTS.REPORTS}?student_id=${user?.id}&limit=10`)
      ])

      if (statsRes.success) {
        setStats(statsRes.data.overview || {})
      }

      if (attendanceRes.success) {
        setAttendanceData(attendanceRes.data.reports || [])
      }

      if (performanceRes.success) {
        setCoursePerformance(performanceRes.data || [])
      }

      if (reportsRes.success) {
        setRecentReports(reportsRes.data.reports || [])
      }
    } catch (err) {
      console.error("Failed to fetch monitoring data:", err)
    } finally {
      setLoading(false)
    }
  }

  const getAttendanceColor = (percentage) => {
    if (percentage >= 80) return "success"
    if (percentage >= 60) return "warning"
    return "danger"
  }

  const getPerformanceColor = (percentage) => {
    if (percentage >= 80) return "success"
    if (percentage >= 70) return "info"
    if (percentage >= 60) return "warning"
    return "danger"
  }

  const calculateOverallAttendance = () => {
    if (!attendanceData.length) return 0
    
    const totalClasses = attendanceData.length
    const attendedClasses = attendanceData.filter(report => 
      report.actual_present > 0
    ).length
    
    return totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0
  }

  const getRecentAttendanceTrend = () => {
    const recent = attendanceData.slice(-5) // Last 5 reports
    return recent.map(report => ({
      date: new Date(report.lecture_date).toLocaleDateString(),
      present: report.actual_present > 0,
      course: report.course_name
    }))
  }

  const getUpcomingClasses = () => {
    // This would typically come from an API
    // For now, we'll return mock data or filter from recent reports
    return recentReports.slice(0, 3).map(report => ({
      course: report.course_name,
      lecturer: report.lecturer_name,
      date: new Date(report.lecture_date),
      venue: report.venue,
      time: report.scheduled_time
    }))
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading monitoring data...</span>
        </div>
      </div>
    )
  }

  const overallAttendance = calculateOverallAttendance()
  const attendanceTrend = getRecentAttendanceTrend()
  const upcomingClasses = getUpcomingClasses()

  return (
    <div className="container-fluid py-4">
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h4 className="text-primary mb-1">My Academic Monitoring</h4>
              <p className="text-muted mb-0">Track your attendance, performance, and academic progress</p>
            </div>
            <div className="d-flex gap-2">
              <select
                className="form-select"
                style={{ minWidth: "200px" }}
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
              >
                <option value="current_semester">Current Semester</option>
                <option value="last_30_days">Last 30 Days</option>
                <option value="last_7_days">Last 7 Days</option>
                <option value="all_time">All Time</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="card shadow-sm border-left-primary h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                    Overall Attendance
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-primary">{overallAttendance}%</div>
                  <small className="text-muted">
                    {attendanceData.filter(r => r.actual_present > 0).length} of {attendanceData.length} classes
                  </small>
                </div>
                <i className="fas fa-user-check fa-2x text-gray-300"></i>
              </div>
              <div className="mt-2">
                <div className="progress" style={{ height: "6px" }}>
                  <div
                    className={`progress-bar bg-${getAttendanceColor(overallAttendance)}`}
                    style={{ width: `${overallAttendance}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="card shadow-sm border-left-success h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                    Courses Enrolled
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-success">
                    {stats?.courses_enrolled || coursePerformance.length}
                  </div>
                  <small className="text-muted">Active courses</small>
                </div>
                <i className="fas fa-book fa-2x text-gray-300"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="card shadow-sm border-left-info h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="text-xs font-weight-bold text-info text-uppercase mb-1">
                    Classes This Week
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-info">
                    {stats?.weekly_classes || recentReports.length}
                  </div>
                  <small className="text-muted">Scheduled lectures</small>
                </div>
                <i className="fas fa-calendar-alt fa-2x text-gray-300"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="card shadow-sm border-left-warning h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">
                    Avg Performance
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-warning">
                    {stats?.avg_performance || "N/A"}%
                  </div>
                  <small className="text-muted">Based on assessments</small>
                </div>
                <i className="fas fa-chart-line fa-2x text-gray-300"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Left Column - Attendance & Performance */}
        <div className="col-lg-8 mb-4">
          {/* Attendance Trend */}
          <div className="card shadow mb-4">
            <div className="card-header bg-white">
              <h6 className="mb-0 text-primary">Recent Attendance Trend</h6>
            </div>
            <div className="card-body">
              {attendanceTrend.length === 0 ? (
                <div className="text-center py-4">
                  <i className="fas fa-calendar-times fa-2x text-muted mb-3"></i>
                  <p className="text-muted mb-0">No attendance data available</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Course</th>
                        <th>Status</th>
                        <th>Attendance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceTrend.map((attendance, index) => (
                        <tr key={index}>
                          <td>{attendance.date}</td>
                          <td>
                            <small>{attendance.course}</small>
                          </td>
                          <td>
                            {attendance.present ? (
                              <span className="badge bg-success">
                                <i className="fas fa-check me-1"></i>
                                Present
                              </span>
                            ) : (
                              <span className="badge bg-danger">
                                <i className="fas fa-times me-1"></i>
                                Absent
                              </span>
                            )}
                          </td>
                          <td>
                            <div className="progress" style={{ height: "8px", width: "100px" }}>
                              <div
                                className={`progress-bar bg-${attendance.present ? "success" : "danger"}`}
                                style={{ width: "100%" }}
                              ></div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Course Performance */}
          <div className="card shadow">
            <div className="card-header bg-white">
              <h6 className="mb-0 text-primary">Course Performance Overview</h6>
            </div>
            <div className="card-body">
              {coursePerformance.length === 0 ? (
                <div className="text-center py-4">
                  <i className="fas fa-chart-bar fa-2x text-muted mb-3"></i>
                  <p className="text-muted mb-0">No performance data available</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>Course</th>
                        <th>Attendance</th>
                        <th>Performance</th>
                        <th>Grade</th>
                        <th>Trend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {coursePerformance.map((course, index) => {
                        const attendanceColor = getAttendanceColor(course.attendance_rate)
                        const performanceColor = getPerformanceColor(course.performance_score)
                        
                        return (
                          <tr key={index}>
                            <td>
                              <strong>{course.course_name}</strong>
                              <br />
                              <small className="text-muted">{course.course_code}</small>
                            </td>
                            <td>
                              <span className={`badge bg-${attendanceColor}`}>
                                {Math.round(course.attendance_rate || 0)}%
                              </span>
                            </td>
                            <td>
                              <span className={`badge bg-${performanceColor}`}>
                                {Math.round(course.performance_score || 0)}%
                              </span>
                            </td>
                            <td>
                              <strong className={`text-${performanceColor}`}>
                                {course.grade || "N/A"}
                              </strong>
                            </td>
                            <td>
                              <div className="progress" style={{ height: "8px", width: "100px" }}>
                                <div
                                  className={`progress-bar bg-${performanceColor}`}
                                  style={{ width: `${course.performance_score || 0}%` }}
                                ></div>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Upcoming & Quick Stats */}
        <div className="col-lg-4 mb-4">
          {/* Upcoming Classes */}
          <div className="card shadow mb-4">
            <div className="card-header bg-white">
              <h6 className="mb-0 text-primary">Upcoming Classes</h6>
            </div>
            <div className="card-body">
              {upcomingClasses.length === 0 ? (
                <div className="text-center py-3">
                  <i className="fas fa-calendar-plus fa-2x text-muted mb-2"></i>
                  <p className="text-muted mb-0">No upcoming classes</p>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {upcomingClasses.map((classItem, index) => (
                    <div key={index} className="list-group-item px-0">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h6 className="mb-0 text-primary">{classItem.course}</h6>
                        <small className="text-muted">
                          {classItem.date.toLocaleDateString()}
                        </small>
                      </div>
                      <div className="mb-2">
                        <small className="text-muted">
                          <i className="fas fa-user me-1"></i>
                          {classItem.lecturer}
                        </small>
                      </div>
                      <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">
                          <i className="fas fa-map-marker-alt me-1"></i>
                          {classItem.venue}
                        </small>
                        <small className="text-muted">
                          <i className="fas fa-clock me-1"></i>
                          {classItem.time}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="card shadow">
            <div className="card-header bg-white">
              <h6 className="mb-0 text-primary">Quick Statistics</h6>
            </div>
            <div className="card-body">
              <div className="row text-center">
                <div className="col-6 mb-3">
                  <div className="border rounded p-3">
                    <div className="h4 mb-1 text-primary">{stats?.classes_attended || 0}</div>
                    <small className="text-muted">Classes Attended</small>
                  </div>
                </div>
                <div className="col-6 mb-3">
                  <div className="border rounded p-3">
                    <div className="h4 mb-1 text-success">{stats?.assignments_completed || 0}</div>
                    <small className="text-muted">Assignments Done</small>
                  </div>
                </div>
                <div className="col-6">
                  <div className="border rounded p-3">
                    <div className="h4 mb-1 text-info">{stats?.exams_taken || 0}</div>
                    <small className="text-muted">Exams Taken</small>
                  </div>
                </div>
                <div className="col-6">
                  <div className="border rounded p-3">
                    <div className="h4 mb-1 text-warning">{stats?.pending_work || 0}</div>
                    <small className="text-muted">Pending Work</small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Attendance Alert */}
          {overallAttendance < 75 && (
            <div className="alert alert-warning mt-4" role="alert">
              <div className="d-flex">
                <i className="fas fa-exclamation-triangle me-2 mt-1"></i>
                <div>
                  <h6 className="alert-heading mb-1">Attendance Alert</h6>
                  <p className="mb-0">
                    Your attendance is below 75%. Regular attendance is crucial for academic success.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="row">
        <div className="col-12">
          <div className="card shadow">
            <div className="card-header bg-white">
              <h6 className="mb-0 text-primary">Recent Academic Activity</h6>
            </div>
            <div className="card-body">
              {recentReports.length === 0 ? (
                <div className="text-center py-4">
                  <i className="fas fa-history fa-2x text-muted mb-3"></i>
                  <p className="text-muted mb-0">No recent activity recorded</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Course</th>
                        <th>Topic</th>
                        <th>Attendance</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentReports.map((report) => {
                        const wasPresent = report.actual_present > 0
                        return (
                          <tr key={report.id}>
                            <td>{new Date(report.lecture_date).toLocaleDateString()}</td>
                            <td>
                              <strong>{report.course_name}</strong>
                              <br />
                              <small className="text-muted">{report.course_code}</small>
                            </td>
                            <td>
                              <small>{report.topic || "Not specified"}</small>
                            </td>
                            <td>
                              {wasPresent ? (
                                <span className="badge bg-success">Present</span>
                              ) : (
                                <span className="badge bg-danger">Absent</span>
                              )}
                            </td>
                            <td>
                              <small className="text-muted">
                                Week {report.week_of_reporting}
                              </small>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
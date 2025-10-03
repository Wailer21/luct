"use client"

import { useEffect, useState } from "react"
import { useAuth } from "../../utils/auth"
import { apiMethods, API_ENDPOINTS } from "../../utils/api"

export default function PRLMonitoring() {
  const { token } = useAuth()
  const [stats, setStats] = useState(null)
  const [weeklyData, setWeeklyData] = useState([])
  const [courseStats, setCourseStats] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    fetchMonitoringData()
  }, [token])

  const fetchMonitoringData = async () => {
    try {
      const [statsRes, courseStatsRes] = await Promise.all([
        apiMethods.get(API_ENDPOINTS.REPORTS_STATS),
        apiMethods.get(API_ENDPOINTS.REPORTS_COURSE_STATS),
      ])

      if (statsRes.success) {
        setStats(statsRes.data.overview)
        setWeeklyData(statsRes.data.weekly_trend || [])
      }

      if (courseStatsRes.success) {
        setCourseStats(courseStatsRes.data || [])
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

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading monitoring data...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container-fluid py-4">
      <div className="row mb-4">
        <div className="col-12">
          <h4 className="text-primary mb-1">System Monitoring</h4>
          <p className="text-muted mb-0">Monitor overall system performance and reporting trends</p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="row mb-4">
          <div className="col-md-3 mb-3">
            <div className="card shadow-sm border-left-primary h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">Total Reports</div>
                    <div className="h5 mb-0 font-weight-bold">{stats.total_reports || 0}</div>
                  </div>
                  <i className="fas fa-clipboard-list fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-3 mb-3">
            <div className="card shadow-sm border-left-success h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="text-xs font-weight-bold text-success text-uppercase mb-1">Avg Attendance</div>
                    <div className="h5 mb-0 font-weight-bold">{Math.round(stats.avg_attendance || 0)}%</div>
                  </div>
                  <i className="fas fa-users fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-3 mb-3">
            <div className="card shadow-sm border-left-info h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="text-xs font-weight-bold text-info text-uppercase mb-1">Active Lecturers</div>
                    <div className="h5 mb-0 font-weight-bold">{stats.active_lecturers || 0}</div>
                  </div>
                  <i className="fas fa-chalkboard-teacher fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-3 mb-3">
            <div className="card shadow-sm border-left-warning h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">Courses Covered</div>
                    <div className="h5 mb-0 font-weight-bold">{stats.courses_covered || 0}</div>
                  </div>
                  <i className="fas fa-book fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Weekly Trend */}
      {weeklyData.length > 0 && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card shadow">
              <div className="card-header bg-white">
                <h6 className="mb-0 text-primary">Weekly Reporting Trend</h6>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Week</th>
                        <th>Reports Submitted</th>
                        <th>Avg Attendance</th>
                        <th>Performance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {weeklyData.map((week, index) => {
                        const avgAttendance = Math.round(week.avg_attendance || 0)
                        const color = getAttendanceColor(avgAttendance)
                        return (
                          <tr key={index}>
                            <td>
                              <strong>Week {week.week}</strong>
                            </td>
                            <td>
                              <span className="badge bg-secondary">{week.reports_count}</span>
                            </td>
                            <td>
                              <span className={`badge bg-${color}`}>{avgAttendance}%</span>
                            </td>
                            <td>
                              <div className="progress" style={{ height: "10px", width: "200px" }}>
                                <div
                                  className={`progress-bar bg-${color}`}
                                  style={{ width: `${avgAttendance}%` }}
                                ></div>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Course Performance */}
      {courseStats.length > 0 && (
        <div className="row">
          <div className="col-12">
            <div className="card shadow">
              <div className="card-header bg-white">
                <h6 className="mb-0 text-primary">Course Performance Overview</h6>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>Course</th>
                        <th>Reports</th>
                        <th>Avg Attendance</th>
                        <th>Total Students</th>
                        <th>Performance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courseStats.map((course, index) => {
                        const avgAttendance = Math.round(course.avg_attendance || 0)
                        const color = getAttendanceColor(avgAttendance)
                        return (
                          <tr key={index}>
                            <td>
                              <strong>{course.course_name}</strong>
                              <br />
                              <small className="text-muted">{course.course_code}</small>
                            </td>
                            <td>
                              <span className="badge bg-secondary">{course.report_count}</span>
                            </td>
                            <td>
                              <span className={`badge bg-${color}`}>{avgAttendance}%</span>
                            </td>
                            <td>{course.total_registered}</td>
                            <td>
                              <div className="progress" style={{ height: "10px" }}>
                                <div
                                  className={`progress-bar bg-${color}`}
                                  style={{ width: `${avgAttendance}%` }}
                                ></div>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
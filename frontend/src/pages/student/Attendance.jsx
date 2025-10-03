"use client"

import { useEffect, useState } from "react"
import { useAuth } from "../../utils/auth"
import { apiMethods, API_ENDPOINTS } from "../../utils/api"

export default function StudentAttendance() {
  const { token, user } = useAuth()
  const [attendanceData, setAttendanceData] = useState([])
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState("")
  const [selectedMonth, setSelectedMonth] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    fetchAttendanceData()
  }, [token, selectedCourse, selectedMonth])

  const fetchAttendanceData = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedCourse) params.append('course_id', selectedCourse)
      if (selectedMonth) params.append('month', selectedMonth)
      params.append('student_id', user?.id)

      const res = await apiMethods.get(`${API_ENDPOINTS.REPORTS}?${params}`)
      
      if (res.success) {
        setAttendanceData(res.data.reports || [])
      }
    } catch (err) {
      console.error("Failed to fetch attendance data:", err)
    } finally {
      setLoading(false)
    }
  }

  const getCourseAttendanceStats = (courseId) => {
    const courseReports = attendanceData.filter(report => 
      !courseId || report.course_id === courseId
    )
    
    const totalClasses = courseReports.length
    const attendedClasses = courseReports.filter(report => report.actual_present > 0).length
    const attendanceRate = totalClasses > 0 ? (attendedClasses / totalClasses) * 100 : 0
    
    return {
      totalClasses,
      attendedClasses,
      attendanceRate: Math.round(attendanceRate),
      missedClasses: totalClasses - attendedClasses
    }
  }

  const getMonthlyAttendance = () => {
    const monthlyData = {}
    
    attendanceData.forEach(report => {
      const month = new Date(report.lecture_date).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long' 
      })
      
      if (!monthlyData[month]) {
        monthlyData[month] = { present: 0, total: 0 }
      }
      
      monthlyData[month].total++
      if (report.actual_present > 0) {
        monthlyData[month].present++
      }
    })
    
    return monthlyData
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading attendance data...</span>
        </div>
      </div>
    )
  }

  const overallStats = getCourseAttendanceStats()
  const monthlyAttendance = getMonthlyAttendance()

  return (
    <div className="container-fluid py-4">
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h4 className="text-primary mb-1">My Attendance Details</h4>
              <p className="text-muted mb-0">Detailed view of your class attendance records</p>
            </div>
            <div className="d-flex gap-2 flex-wrap">
              <select
                className="form-select"
                style={{ minWidth: "180px" }}
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
              >
                <option value="">All Courses</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.course_name}
                  </option>
                ))}
              </select>
              <select
                className="form-select"
                style={{ minWidth: "150px" }}
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                <option value="">All Months</option>
                {Object.keys(monthlyAttendance).map(month => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="card text-center">
            <div className="card-body">
              <h3 className="text-primary">{overallStats.attendanceRate}%</h3>
              <p className="text-muted mb-0">Overall Attendance</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card text-center">
            <div className="card-body">
              <h3 className="text-success">{overallStats.attendedClasses}</h3>
              <p className="text-muted mb-0">Classes Attended</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card text-center">
            <div className="card-body">
              <h3 className="text-danger">{overallStats.missedClasses}</h3>
              <p className="text-muted mb-0">Classes Missed</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card text-center">
            <div className="card-body">
              <h3 className="text-info">{overallStats.totalClasses}</h3>
              <p className="text-muted mb-0">Total Classes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Breakdown */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow">
            <div className="card-header bg-white">
              <h6 className="mb-0 text-primary">Monthly Attendance Breakdown</h6>
            </div>
            <div className="card-body">
              {Object.keys(monthlyAttendance).length === 0 ? (
                <div className="text-center py-4">
                  <i className="fas fa-calendar-alt fa-2x text-muted mb-3"></i>
                  <p className="text-muted mb-0">No attendance data available</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Month</th>
                        <th>Classes Held</th>
                        <th>Classes Attended</th>
                        <th>Attendance Rate</th>
                        <th>Performance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(monthlyAttendance).map(([month, data]) => {
                        const rate = Math.round((data.present / data.total) * 100)
                        const color = rate >= 80 ? "success" : rate >= 60 ? "warning" : "danger"
                        
                        return (
                          <tr key={month}>
                            <td><strong>{month}</strong></td>
                            <td>{data.total}</td>
                            <td>{data.present}</td>
                            <td>
                              <span className={`badge bg-${color}`}>{rate}%</span>
                            </td>
                            <td>
                              <div className="progress" style={{ height: "8px", width: "120px" }}>
                                <div
                                  className={`progress-bar bg-${color}`}
                                  style={{ width: `${rate}%` }}
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
      </div>

      {/* Detailed Records */}
      <div className="row">
        <div className="col-12">
          <div className="card shadow">
            <div className="card-header bg-white">
              <h6 className="mb-0 text-primary">Detailed Attendance Records</h6>
            </div>
            <div className="card-body">
              {attendanceData.length === 0 ? (
                <div className="text-center py-4">
                  <i className="fas fa-clipboard-list fa-2x text-muted mb-3"></i>
                  <p className="text-muted mb-0">No attendance records found</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>Date</th>
                        <th>Course</th>
                        <th>Lecturer</th>
                        <th>Topic</th>
                        <th>Time</th>
                        <th>Status</th>
                        <th>Week</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceData.map((report) => (
                        <tr key={report.id}>
                          <td>{new Date(report.lecture_date).toLocaleDateString()}</td>
                          <td>
                            <strong>{report.course_name}</strong>
                            <br />
                            <small className="text-muted">{report.course_code}</small>
                          </td>
                          <td>{report.lecturer_name}</td>
                          <td>
                            <small>{report.topic || "Not specified"}</small>
                          </td>
                          <td>
                            <small>{report.scheduled_time}</small>
                          </td>
                          <td>
                            {report.actual_present > 0 ? (
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
                            <span className="badge bg-secondary">
                              Week {report.week_of_reporting}
                            </span>
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
    </div>
  )
}
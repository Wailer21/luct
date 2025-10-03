"use client"

import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../utils/auth"
import { api, API_ENDPOINTS } from "../utils/api";

export default function Home() {
  const { user, isAuthenticated, loading } = useAuth()
  const [stats, setStats] = useState(null)
  const [recentActivity, setRecentActivity] = useState([])
  const [systemStatus, setSystemStatus] = useState(null)
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    fetchHomeData()
  }, [user])

  const fetchHomeData = async () => {
    try {
      setLoadingStats(true)
      
      // Fetch system stats based on user role
      if (isAuthenticated) {
        const [statsRes, activityRes, healthRes] = await Promise.all([
          apiMethods.getReportStats(),
          apiMethods.getReports({ limit: 5 }),
          apiMethods.healthCheck()
        ])

        if (statsRes.success) setStats(statsRes.data)
        if (activityRes.success) setRecentActivity(activityRes.data?.reports || [])
        if (healthRes.success) setSystemStatus(healthRes.data)
      } else {
        const healthRes = await apiMethods.healthCheck()
        if (healthRes.success) setSystemStatus(healthRes.data)
      }
    } catch (error) {
      console.error("Failed to fetch home data:", error)
    } finally {
      setLoadingStats(false)
    }
  }

  const getRoleBasedContent = () => {
    if (!user) return null

    const content = {
      Student: {
        title: "Student Dashboard",
        subtitle: "Track your academic progress and performance",
        features: [
          { icon: "chart-line", title: "Progress Monitoring", desc: "Track your attendance and performance" },
          { icon: "calendar-check", title: "Attendance", desc: "View your class attendance records" },
          { icon: "star", title: "Rate Courses", desc: "Provide feedback on courses and lecturers" },
          { icon: "search", title: "Search", desc: "Find courses and reports easily" }
        ],
        quickActions: [
          { path: "/monitoring", icon: "chart-line", label: "My Progress", color: "primary" },
          { path: "/attendance", icon: "calendar-check", label: "Attendance", color: "success" },
          { path: "/rating", icon: "star", label: "Rate Courses", color: "warning" },
          { path: "/reports", icon: "clipboard-list", label: "View Reports", color: "info" }
        ]
      },
      Lecturer: {
        title: "Lecturer Portal",
        subtitle: "Manage your classes and submit reports efficiently",
        features: [
          { icon: "plus-circle", title: "Create Reports", desc: "Submit weekly lecture reports" },
          { icon: "chalkboard-teacher", title: "My Classes", desc: "Manage your assigned classes" },
          { icon: "star", title: "My Ratings", desc: "View student feedback and ratings" },
          { icon: "chart-bar", title: "Performance", desc: "Monitor your teaching performance" }
        ],
        quickActions: [
          { path: "/report", icon: "plus-circle", label: "New Report", color: "primary" },
          { path: "/my-classes", icon: "chalkboard-teacher", label: "My Classes", color: "success" },
          { path: "/rating", icon: "star", label: "My Ratings", color: "warning" },
          { path: "/reports", icon: "clipboard-list", label: "All Reports", color: "info" }
        ]
      },
      PRL: {
        title: "Program Leader Dashboard",
        subtitle: "Oversee program performance and provide feedback",
        features: [
          { icon: "book", title: "Course Management", desc: "Manage courses in your program" },
          { icon: "chart-bar", title: "Analytics", desc: "View program performance metrics" },
          { icon: "comments", title: "Feedback", desc: "Provide feedback on lecture reports" },
          { icon: "search", title: "Monitoring", desc: "Monitor overall program health" }
        ],
        quickActions: [
          { path: "/prl-courses", icon: "book", label: "Courses", color: "primary" },
          { path: "/analytics", icon: "chart-bar", label: "Analytics", color: "success" },
          { path: "/feedback", icon: "comments", label: "Feedback", color: "warning" },
          { path: "/prl-monitoring", icon: "search", label: "Monitoring", color: "info" }
        ]
      },
      PL: {
        title: "Department Leadership",
        subtitle: "Manage department operations and oversight",
        features: [
          { icon: "book", title: "Course Oversight", desc: "Manage department courses" },
          { icon: "users", title: "Class Management", desc: "Oversee class assignments" },
          { icon: "comments", title: "Feedback System", desc: "Review and provide feedback" },
          { icon: "clipboard-list", title: "Reports", desc: "View all department reports" }
        ],
        quickActions: [
          { path: "/pl-courses", icon: "book", label: "Courses", color: "primary" },
          { path: "/classes", icon: "users", label: "Classes", color: "success" },
          { path: "/feedback", icon: "comments", label: "Feedback", color: "warning" },
          { path: "/reports", icon: "clipboard-list", label: "Reports", color: "info" }
        ]
      },
      Admin: {
        title: "System Administration",
        subtitle: "Manage the entire LUCT Reports system",
        features: [
          { icon: "users-cog", title: "User Management", desc: "Manage all system users" },
          { icon: "chart-bar", title: "System Analytics", desc: "View comprehensive system metrics" },
          { icon: "book", title: "Course Management", desc: "Manage all courses system-wide" },
          { icon: "cog", title: "System Settings", desc: "Configure system parameters" }
        ],
        quickActions: [
          { path: "/users", icon: "users-cog", label: "Users", color: "primary" },
          { path: "/analytics", icon: "chart-bar", label: "Analytics", color: "success" },
          { path: "/courses", icon: "book", label: "Courses", color: "warning" },
          { path: "/reports", icon: "clipboard-list", label: "Reports", color: "info" }
        ]
      }
    }

    return content[user.role] || content.Student
  }

  const getWelcomeMessage = () => {
    if (!user) return "Welcome to LUCT Reports System"
    
    const messages = {
      Student: `Welcome back, ${user.first_name}! Ready to track your progress?`,
      Lecturer: `Welcome, ${user.first_name}! Ready to manage your classes?`,
      PRL: `Welcome, ${user.first_name}! Let's oversee the program.`,
      PL: `Welcome, ${user.first_name}! Time to lead the department.`,
      Admin: `Welcome, ${user.first_name}! System administration dashboard.`
    }

    return messages[user.role] || `Welcome back, ${user.first_name}!`
  }

  const renderStatsCards = () => {
    if (!stats || !isAuthenticated) return null

    const statConfig = {
      Student: [
        { key: 'courses_covered', label: 'Courses', icon: 'book', color: 'primary' },
        { key: 'avg_attendance', label: 'Avg Attendance', icon: 'user-check', color: 'success', suffix: '%' },
        { key: 'total_reports', label: 'Classes', icon: 'clipboard-list', color: 'info' }
      ],
      Lecturer: [
        { key: 'total_reports', label: 'My Reports', icon: 'clipboard-list', color: 'primary' },
        { key: 'avg_attendance', label: 'Avg Attendance', icon: 'users', color: 'success', suffix: '%' },
        { key: 'courses_covered', label: 'Courses', icon: 'book', color: 'info' }
      ],
      PRL: [
        { key: 'total_reports', label: 'Total Reports', icon: 'clipboard-list', color: 'primary' },
        { key: 'avg_attendance', label: 'Avg Attendance', icon: 'chart-line', color: 'success', suffix: '%' },
        { key: 'active_lecturers', label: 'Active Lecturers', icon: 'chalkboard-teacher', color: 'info' }
      ],
      PL: [
        { key: 'total_reports', label: 'Department Reports', icon: 'clipboard-list', color: 'primary' },
        { key: 'avg_attendance', label: 'Avg Attendance', icon: 'chart-line', color: 'success', suffix: '%' },
        { key: 'courses_covered', label: 'Courses', icon: 'book', color: 'info' }
      ],
      Admin: [
        { key: 'total_reports', label: 'System Reports', icon: 'clipboard-list', color: 'primary' },
        { key: 'avg_attendance', label: 'Avg Attendance', icon: 'chart-line', color: 'success', suffix: '%' },
        { key: 'active_lecturers', label: 'Active Lecturers', icon: 'users', color: 'info' }
      ]
    }

    const userStats = statConfig[user.role] || statConfig.Student

    return (
      <div className="row mb-4">
        {userStats.map((stat, index) => (
          <div key={index} className="col-md-4 mb-3">
            <div className={`card border-left-${stat.color} shadow-sm h-100`}>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="text-xs font-weight-bold text-uppercase mb-1" style={{ color: `var(--bs-${stat.color})` }}>
                      {stat.label}
                    </div>
                    <div className="h5 mb-0 font-weight-bold text-gray-800">
                      {stats[stat.key] || 0}{stat.suffix || ''}
                    </div>
                  </div>
                  <i className={`fas fa-${stat.icon} fa-2x text-gray-300`}></i>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderRecentActivity = () => {
    if (!isAuthenticated || recentActivity.length === 0) return null

    return (
      <div className="card shadow mb-4">
        <div className="card-header bg-white">
          <h6 className="mb-0 text-primary">
            <i className="fas fa-history me-2"></i>
            Recent Activity
          </h6>
        </div>
        <div className="card-body">
          <div className="list-group list-group-flush">
            {recentActivity.slice(0, 5).map((activity, index) => (
              <div key={index} className="list-group-item px-0">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h6 className="mb-1">{activity.course_name}</h6>
                    <p className="mb-1 text-muted small">{activity.topic || "No topic specified"}</p>
                    <small className="text-muted">
                      <i className="fas fa-user me-1"></i>
                      {activity.lecturer_name} • {new Date(activity.lecture_date).toLocaleDateString()}
                    </small>
                  </div>
                  <span className={`badge bg-${activity.actual_present > 0 ? 'success' : 'secondary'}`}>
                    {activity.actual_present}/{activity.total_registered}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderSystemStatus = () => {
    if (!systemStatus) return null

    return (
      <div className="card shadow mb-4">
        <div className="card-header bg-white">
          <h6 className="mb-0 text-primary">
            <i className="fas fa-server me-2"></i>
            System Status
          </h6>
        </div>
        <div className="card-body">
          <div className="row text-center">
            <div className="col-4">
              <div className={`border rounded p-3 ${systemStatus.database === 'connected' ? 'border-success' : 'border-danger'}`}>
                <i className={`fas fa-database fa-2x mb-2 ${systemStatus.database === 'connected' ? 'text-success' : 'text-danger'}`}></i>
                <div className="h6 mb-1">Database</div>
                <small className={`badge bg-${systemStatus.database === 'connected' ? 'success' : 'danger'}`}>
                  {systemStatus.database === 'connected' ? 'Online' : 'Offline'}
                </small>
              </div>
            </div>
            <div className="col-4">
              <div className="border rounded p-3 border-success">
                <i className="fas fa-cloud fa-2x mb-2 text-success"></i>
                <div className="h6 mb-1">API</div>
                <small className="badge bg-success">Online</small>
              </div>
            </div>
            <div className="col-4">
              <div className="border rounded p-3 border-info">
                <i className="fas fa-shield-alt fa-2x mb-2 text-info"></i>
                <div className="h6 mb-1">Security</div>
                <small className="badge bg-info">Active</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container-fluid py-5">
        <div className="row justify-content-center">
          <div className="col-md-6 text-center">
            <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }}></div>
            <h4 className="text-primary">Loading LUCT Reports...</h4>
            <p className="text-muted">Preparing your dashboard</p>
          </div>
        </div>
      </div>
    )
  }

  const roleContent = getRoleBasedContent()

  return (
    <div className="container-fluid py-4">
      {/* Hero Section */}
      <div className="row mb-5">
        <div className="col-12">
          <div className="jumbotron bg-primary text-white rounded-3 p-5 shadow">
            <div className="row align-items-center">
              <div className="col-lg-8">
                <h1 className="display-4 fw-bold mb-3">
                  <i className="fas fa-university me-3"></i>
                  LUCT Reports System
                </h1>
                <p className="lead mb-4">{getWelcomeMessage()}</p>
                
                {!isAuthenticated ? (
                  <div className="d-flex gap-3 flex-wrap">
                    <Link to="/login" className="btn btn-light btn-lg px-4">
                      <i className="fas fa-sign-in-alt me-2"></i>
                      Sign In
                    </Link>
                    <Link to="/register" className="btn btn-outline-light btn-lg px-4">
                      <i className="fas fa-user-plus me-2"></i>
                      Register
                    </Link>
                  </div>
                ) : (
                  <p className="mb-0">
                    Access your personalized dashboard and manage your academic activities.
                  </p>
                )}
              </div>
              <div className="col-lg-4 text-center d-none d-lg-block">
                <i className="fas fa-chart-line fa-8x text-white-50"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Authenticated User Dashboard */}
      {isAuthenticated && user && (
        <>
          {/* Role Header */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="d-flex justify-content-between align-items-center flex-wrap">
                <div>
                  <h2 className="text-primary mb-1">{roleContent.title}</h2>
                  <p className="text-muted mb-0">{roleContent.subtitle}</p>
                </div>
                <span className="badge bg-primary fs-6 px-3 py-2 text-capitalize">
                  <i className="fas fa-user-tag me-2"></i>
                  {user.role} Role
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          {loadingStats ? (
            <div className="row mb-4">
              <div className="col-12 text-center py-4">
                <div className="spinner-border text-primary"></div>
                <p className="text-muted mt-2">Loading statistics...</p>
              </div>
            </div>
          ) : (
            renderStatsCards()
          )}

          {/* Quick Actions */}
          <div className="row mb-5">
            <div className="col-12">
              <h4 className="text-primary mb-3">
                <i className="fas fa-bolt me-2"></i>
                Quick Actions
              </h4>
              <div className="row">
                {roleContent.quickActions.map((action, index) => (
                  <div key={index} className="col-md-3 col-sm-6 mb-3">
                    <Link 
                      to={action.path} 
                      className={`card btn btn-outline-${action.color} border-${action.color} h-100 text-decoration-none text-dark`}
                      style={{ transition: 'all 0.3s ease' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-5px)'
                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    >
                      <div className="card-body text-center py-4">
                        <i className={`fas fa-${action.icon} fa-2x text-${action.color} mb-3`}></i>
                        <h6 className="card-title">{action.label}</h6>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="row">
            {/* Features Section */}
            <div className="col-lg-8 mb-4">
              <div className="card shadow">
                <div className="card-header bg-white">
                  <h5 className="mb-0 text-primary">
                    <i className="fas fa-star me-2"></i>
                    Key Features
                  </h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    {roleContent.features.map((feature, index) => (
                      <div key={index} className="col-md-6 mb-3">
                        <div className="d-flex align-items-start">
                          <i className={`fas fa-${feature.icon} fa-2x text-primary me-3 mt-1`}></i>
                          <div>
                            <h6 className="mb-1">{feature.title}</h6>
                            <p className="text-muted mb-0 small">{feature.desc}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="col-lg-4">
              {renderRecentActivity()}
              {renderSystemStatus()}
            </div>
          </div>
        </>
      )}

      {/* Public Features Section */}
      {!isAuthenticated && (
        <div className="row mt-5">
          <div className="col-12 text-center mb-5">
            <h2 className="text-primary mb-3">Where creativity meets innovation</h2>
            <p className="lead text-muted">Streamline academic reporting and monitoring across the university</p>
          </div>

          <div className="col-md-4 mb-4">
            <div className="card border-0 shadow-sm h-100 text-center">
              <div className="card-body p-4">
                <i className="fas fa-chart-line fa-3x text-primary mb-3"></i>
                <h5 className="card-title">Real-time Monitoring</h5>
                <p className="card-text text-muted">
                  Track attendance, performance, and academic progress with live dashboards and analytics.
                </p>
              </div>
            </div>
          </div>

          <div className="col-md-4 mb-4">
            <div className="card border-0 shadow-sm h-100 text-center">
              <div className="card-body p-4">
                <i className="fas fa-comments fa-3x text-success mb-3"></i>
                <h5 className="card-title">Constructive Feedback</h5>
                <p className="card-text text-muted">
                  Provide and receive meaningful feedback to enhance teaching and learning experiences.
                </p>
              </div>
            </div>
          </div>

          <div className="col-md-4 mb-4">
            <div className="card border-0 shadow-sm h-100 text-center">
              <div className="card-body p-4">
                <i className="fas fa-shield-alt fa-3x text-info mb-3"></i>
                <h5 className="card-title">Role-Based Security</h5>
                <p className="card-text text-muted">
                  Secure access with role-based permissions ensuring data privacy and proper authorization.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer CTA */}
      {!isAuthenticated && (
        <div className="row mt-5">
          <div className="col-12">
            <div className="card bg-gradient-primary text-white shadow-lg">
              <div className="card-body text-center py-5">
                <h3 className="mb-3">Ready to Get Started?</h3>
                <p className="mb-4">Join the LUCT Reports system today and experience streamlined academic management.</p>
                <div className="d-flex gap-3 justify-content-center flex-wrap">
                  <Link to="/register" className="btn btn-light btn-lg px-4">
                    <i className="fas fa-user-plus me-2"></i>
                    Create Account
                  </Link>
                  <Link to="/login" className="btn btn-outline-light btn-lg px-4">
                    <i className="fas fa-sign-in-alt me-2"></i>
                    Sign In
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
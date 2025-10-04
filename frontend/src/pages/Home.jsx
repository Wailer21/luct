import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../utils/auth";
import { apiMethods } from "../utils/api";

export default function Home() {
  const { user, isAuthenticated, loading } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [systemStatus, setSystemStatus] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    fetchHomeData();
  }, [user]);

  const fetchHomeData = async () => {
    try {
      setLoadingStats(true);
      
      if (isAuthenticated) {
        const [statsRes, activityRes, healthRes] = await Promise.all([
          apiMethods.getReportStats(),
          apiMethods.getReports({ limit: 5 }),
          apiMethods.healthCheck()
        ]);

        if (statsRes.success) setStats(statsRes.data);
        if (activityRes.success) setRecentActivity(activityRes.data?.reports || []);
        if (healthRes.success) setSystemStatus(healthRes.data);
      } else {
        const healthRes = await apiMethods.healthCheck();
        if (healthRes.success) setSystemStatus(healthRes.data);
      }
    } catch (error) {
      console.error("Failed to fetch home data:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  const getRoleBasedContent = () => {
    if (!user) return null;

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
    };

    return content[user.role] || content.Student;
  };

  const getWelcomeMessage = () => {
    if (!user) return "Welcome to LUCT Reports System";
    
    const messages = {
      Student: `Welcome back, ${user.first_name}! Ready to track your progress?`,
      Lecturer: `Welcome, ${user.first_name}! Ready to manage your classes?`,
      PRL: `Welcome, ${user.first_name}! Let's oversee the program.`,
      PL: `Welcome, ${user.first_name}! Time to lead the department.`,
      Admin: `Welcome, ${user.first_name}! System administration dashboard.`
    };

    return messages[user.role] || `Welcome back, ${user.first_name}!`;
  };

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
    );
  }

  const roleContent = getRoleBasedContent();

  return (
    <div className="container-fluid py-4">
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

      {isAuthenticated && user && roleContent && (
        <div className="row">
          <div className="col-12">
            <div className="card shadow">
              <div className="card-header bg-white">
                <h2 className="text-primary mb-1">{roleContent.title}</h2>
                <p className="text-muted mb-0">{roleContent.subtitle}</p>
              </div>
              <div className="card-body">
                <div className="row">
                  {roleContent.quickActions.map((action, index) => (
                    <div key={index} className="col-md-3 mb-3">
                      <Link 
                        to={action.path} 
                        className="card btn btn-outline-primary h-100 text-decoration-none"
                      >
                        <div className="card-body text-center">
                          <i className={`fas fa-${action.icon} fa-2x text-primary mb-2`}></i>
                          <h6>{action.label}</h6>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
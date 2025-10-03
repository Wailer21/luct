import React, { useState, useEffect } from "react";
import { useAuth } from "../utils/auth";
import { Link } from "react-router-dom";
import { api, API_ENDPOINTS } from "../utils/api";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchStats();
    }
  }, [isAuthenticated]);

  const fetchStats = async () => {
    try {
      const res = await api.get(API_ENDPOINTS.REPORTS_STATS, true);
      if (res.success) setStats(res.data);
    } catch (err) {
      console.error("Failed to load stats:", err);
    }
  };

  return (
    <div className="container-fluid py-5 bg-light min-vh-100">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          {/* Hero */}
          <div className="card border-0 shadow-lg rounded-4 bg-gradient-primary text-white mb-5">
            <div className="card-body p-5">
              <h1 className="fw-bold">LUCT Reporting System</h1>
              <p className="lead opacity-75 mb-4">
                {isAuthenticated
                  ? `Welcome back, ${user?.first_name}! You are logged in as ${user?.role}.`
                  : "Academic monitoring, rating, and reporting platform"}
              </p>

              {!isAuthenticated && (
                <div className="d-flex gap-3">
                  <Link
                    to="/login"
                    className="btn btn-light rounded-pill px-4 fw-semibold shadow-sm"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="btn btn-outline-light rounded-pill px-4"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          {isAuthenticated && stats && (
            <div className="row g-4">
              <div className="col-md-3">
                <div className="card border-start border-success border-4 shadow-sm rounded-4">
                  <div className="card-body">
                    <h6 className="text-muted">Total Reports</h6>
                    <h3 className="fw-bold text-dark">{stats.total_reports}</h3>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card border-start border-info border-4 shadow-sm rounded-4">
                  <div className="card-body">
                    <h6 className="text-muted">Courses</h6>
                    <h3 className="fw-bold text-dark">{stats.courses}</h3>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card border-start border-warning border-4 shadow-sm rounded-4">
                  <div className="card-body">
                    <h6 className="text-muted">Lecturers</h6>
                    <h3 className="fw-bold text-dark">{stats.lecturers}</h3>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card border-start border-primary border-4 shadow-sm rounded-4">
                  <div className="card-body">
                    <h6 className="text-muted">Students</h6>
                    <h3 className="fw-bold text-dark">{stats.students}</h3>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

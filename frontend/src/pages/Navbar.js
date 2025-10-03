import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../utils/auth";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();

  const menuByRole = {
    Student: [
      { path: "/reports", label: "Monitoring", icon: "fas fa-chart-line" },
      { path: "/rating", label: "Rating", icon: "fas fa-star" },
    ],
    Lecturer: [
      { path: "/classes", label: "Classes", icon: "fas fa-chalkboard-teacher" },
      { path: "/reports", label: "Reports", icon: "fas fa-clipboard-list" },
      { path: "/monitoring", label: "Monitoring", icon: "fas fa-chart-line" },
      { path: "/rating", label: "Rating", icon: "fas fa-star" },
    ],
    PRL: [
      { path: "/courses", label: "Courses", icon: "fas fa-book" },
      { path: "/reports", label: "Reports", icon: "fas fa-clipboard" },
      { path: "/monitoring", label: "Monitoring", icon: "fas fa-chart-line" },
      { path: "/rating", label: "Rating", icon: "fas fa-star" },
      { path: "/classes", label: "Classes", icon: "fas fa-chalkboard" },
    ],
    PL: [
      { path: "/courses", label: "Courses", icon: "fas fa-book" },
      { path: "/reports", label: "Reports", icon: "fas fa-clipboard" },
      { path: "/monitoring", label: "Monitoring", icon: "fas fa-chart-line" },
      { path: "/classes", label: "Classes", icon: "fas fa-chalkboard" },
      { path: "/lectures", label: "Lectures", icon: "fas fa-users" },
      { path: "/rating", label: "Rating", icon: "fas fa-star" },
    ],
  };

  const defaultMenu = [
    { path: "/login", label: "Login", icon: "fas fa-sign-in-alt" },
    { path: "/register", label: "Register", icon: "fas fa-user-plus" },
  ];

  const menu = isAuthenticated ? menuByRole[user?.role] || [] : defaultMenu;

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-gradient-primary shadow-sm">
      <div className="container-fluid">
        <Link className="navbar-brand fw-bold" to="/">
          <i className="fas fa-university me-2"></i>LUCT
        </Link>
        <div className="collapse navbar-collapse">
          <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
            {menu.map((item, idx) => (
              <li className="nav-item" key={idx}>
                <Link to={item.path} className="nav-link fw-semibold">
                  <i className={`${item.icon} me-2`}></i>
                  {item.label}
                </Link>
              </li>
            ))}
            {isAuthenticated && (
              <li className="nav-item">
                <button className="btn btn-link nav-link text-danger" onClick={logout}>
                  <i className="fas fa-sign-out-alt me-2"></i> Logout
                </button>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}

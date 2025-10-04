import React from 'react'

export default function PLCourses() {
  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <div className="card shadow">
            <div className="card-header bg-primary text-white">
              <h3 className="mb-0">
                <i className="fas fa-book me-2"></i>
                PL Courses
              </h3>
            </div>
            <div className="card-body">
              <p className="lead">
                Department Leader Courses
              </p>
              <div className="alert alert-info">
                <i className="fas fa-info-circle me-2"></i>
                Manage department courses
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

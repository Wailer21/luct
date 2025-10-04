import React from 'react'

export default function NotFound() {
  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <div className="card shadow">
            <div className="card-header bg-primary text-white">
              <h3 className="mb-0">
                <i className="fas fa-exclamation-triangle me-2"></i>
                404 - Page Not Found
              </h3>
            </div>
            <div className="card-body">
              <p className="lead">
                The requested page could not be found
              </p>
              <div className="alert alert-info">
                <i className="fas fa-info-circle me-2"></i>
                Please check the URL or navigate back to home
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

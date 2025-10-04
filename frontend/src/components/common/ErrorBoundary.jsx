import React from 'react'

export default function ErrorBoundary() {
  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <div className="card shadow">
            <div className="card-header bg-primary text-white">
              <h3 className="mb-0">
                <i className="fas fa-cog me-2"></i>
                ErrorBoundary
              </h3>
            </div>
            <div className="card-body">
              <p className="lead">
                ErrorBoundary Component
              </p>
              <div className="alert alert-info">
                <i className="fas fa-info-circle me-2"></i>
                This is the ErrorBoundary component
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

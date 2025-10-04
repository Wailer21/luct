import React from 'react'

export default function LoadingSpinner() {
  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <div className="card shadow">
            <div className="card-header bg-primary text-white">
              <h3 className="mb-0">
                <i className="fas fa-cog me-2"></i>
                LoadingSpinner
              </h3>
            </div>
            <div className="card-body">
              <p className="lead">
                LoadingSpinner Component
              </p>
              <div className="alert alert-info">
                <i className="fas fa-info-circle me-2"></i>
                This is the LoadingSpinner component
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

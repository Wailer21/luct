import React from 'react'

export default function PublicRoute() {
  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <div className="card shadow">
            <div className="card-header bg-primary text-white">
              <h3 className="mb-0">
                <i className="fas fa-cog me-2"></i>
                PublicRoute
              </h3>
            </div>
            <div className="card-body">
              <p className="lead">
                PublicRoute Component
              </p>
              <div className="alert alert-info">
                <i className="fas fa-info-circle me-2"></i>
                This is the PublicRoute component
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
